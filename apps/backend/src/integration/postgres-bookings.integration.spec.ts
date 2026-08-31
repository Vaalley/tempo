import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn,
} from 'bun:test';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { closePostgres, db } from '../db';
import { migrateDatabase } from '../db/migrate';
import { bookings, users, workspaces } from '../db/schema';
import { bookingService } from '../modules/bookings/bookings.service';

const integrationEnabled = process.env.RUN_POSTGRES_INTEGRATION === 'true';

process.env.JWT_SECRET ??= 'postgres-integration-test-secret';

const { default: bookingsRoute } = await import('../modules/bookings/bookings.route');

describe.skipIf(!integrationEnabled)('PostgreSQL booking integration', () => {
	let userId = '';
	let workspaceId = 0;
	let authorization = '';

	beforeAll(async () => {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL is required for PostgreSQL integration tests');
		}

		await migrateDatabase();
	});

	beforeEach(async () => {
		const uniqueId = crypto.randomUUID();
		const [user] = await db
			.insert(users)
			.values({
				email: `integration-${uniqueId}@tempo.test`,
				password: 'integration-test-password-hash',
			})
			.returning({ id: users.id, email: users.email, role: users.role });
		const [workspace] = await db
			.insert(workspaces)
			.values({ name: `Integration ${uniqueId}`, type: 'DESK', capacity: 1 })
			.returning({ id: workspaces.id });

		userId = user.id;
		workspaceId = workspace.id;
		authorization = `Bearer ${await sign(
			{
				sub: user.id,
				email: user.email,
				role: user.role,
				exp: Math.floor(Date.now() / 1000) + 60,
			},
			process.env.JWT_SECRET!,
		)}`;
	});

	afterEach(async () => {
		mock.restore();

		if (workspaceId) {
			await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
		}

		if (userId) {
			await db.delete(users).where(eq(users.id, userId));
		}

		userId = '';
		workspaceId = 0;
		authorization = '';
	});

	afterAll(async () => {
		await closePostgres();
	});

	it('persists a complete booking through the authenticated HTTP route', async () => {
		const startAt = new Date(Date.now() + 60 * 60 * 1000);
		const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

		const response = await createBookingRequest(startAt, endAt);

		expect(response.status).toBe(201);

		const responseBody = (await response.json()) as { id: string };
		const persisted = await db.query.bookings.findFirst({
			where: eq(bookings.id, responseBody.id),
		});

		expect(persisted).toMatchObject({
			id: responseBody.id,
			userId,
			workspaceId,
			startAt,
			endAt,
		});
	});

	it('allows only one of two concurrent bookings for the same time slot', async () => {
		const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
		const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
		let overlapChecks = 0;
		let releaseChecks = () => {};
		const bothRequestsChecked = new Promise<void>((resolve) => {
			releaseChecks = resolve;
		});

		spyOn(console, 'error').mockImplementation(() => {});
		spyOn(bookingService, 'checkOverlap').mockImplementation(async () => {
			overlapChecks += 1;

			if (overlapChecks === 2) {
				releaseChecks();
			}

			await bothRequestsChecked;
			return false;
		});

		const responses = await Promise.all([
			createBookingRequest(startAt, endAt),
			createBookingRequest(startAt, endAt),
		]);
		const successfulResponse = responses.find((response) => response.status === 201);
		const conflictingResponse = responses.find((response) => response.status === 409);
		const persisted = await db.query.bookings.findMany({
			where: eq(bookings.workspaceId, workspaceId),
		});

		expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
		expect(successfulResponse).toBeDefined();
		expect(conflictingResponse).toBeDefined();

		if (!conflictingResponse) {
			throw new Error('Expected one conflicting booking response');
		}

		expect(await conflictingResponse.json()).toEqual({
			error: 'This workspace is already booked for this time slot',
		});
		expect(persisted).toHaveLength(1);
	});

	function createBookingRequest(startAt: Date, endAt: Date): Promise<Response> {
		return bookingsRoute.request('/', {
			method: 'POST',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				workspaceId,
				startAt: startAt.toISOString(),
				endAt: endAt.toISOString(),
			}),
		});
	}
});
