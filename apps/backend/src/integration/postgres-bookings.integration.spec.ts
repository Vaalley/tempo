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
import { and, eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { closePostgres, db } from '../db';
import { migrateDatabase } from '../db/migrate';
import { bookingParticipants, bookings, users, workspaces } from '../db/schema';
import { bookingService } from '../modules/bookings/bookings.service';

const integrationEnabled = process.env.RUN_POSTGRES_INTEGRATION === 'true';

process.env.JWT_SECRET ??= 'postgres-integration-test-secret';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:5173';

const { default: bookingsRoute } = await import('../modules/bookings/bookings.route');

describe.skipIf(!integrationEnabled)('PostgreSQL booking integration', () => {
	let userId = '';
	let workspaceId = 0;
	let authorization = '';
	let guestUserId = '';
	let guestAuthorization = '';

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
			.values({ name: `Integration ${uniqueId}`, type: 'MEETING_ROOM', capacity: 2 })
			.returning({ id: workspaces.id });
		const [guest] = await db
			.insert(users)
			.values({
				email: `integration-guest-${uniqueId}@tempo.test`,
				password: 'integration-test-password-hash',
			})
			.returning({ id: users.id, email: users.email, role: users.role });

		userId = user.id;
		guestUserId = guest.id;
		workspaceId = workspace.id;
		authorization = await authorizationFor(user);
		guestAuthorization = await authorizationFor(guest);
	});

	afterEach(async () => {
		mock.restore();

		if (workspaceId) {
			await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
		}

		if (userId) {
			await db.delete(users).where(eq(users.id, userId));
		}
		if (guestUserId) {
			await db.delete(users).where(eq(users.id, guestUserId));
		}

		userId = '';
		guestUserId = '';
		workspaceId = 0;
		authorization = '';
		guestAuthorization = '';
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
			error: 'Ce créneau est déjà réservé pour cet espace',
		});
		expect(persisted).toHaveLength(1);
	});

	it('supports a public invitation, acceptance and QR check-in', async () => {
		const startAt = new Date(Date.now() - 5 * 60 * 1000);
		const endAt = new Date(Date.now() + 60 * 60 * 1000);
		const creationResponse = await createBookingRequest(startAt, endAt, 'PUBLIC');
		expect(creationResponse.status).toBe(201);

		const { id: bookingId } = (await creationResponse.json()) as { id: string };
		const guest = await db.query.users.findFirst({
			where: eq(users.id, guestUserId),
			columns: { email: true },
		});
		if (!guest) throw new Error('Expected integration guest');

		const invitationResponse = await bookingsRoute.request(`/${bookingId}/invitations`, {
			method: 'POST',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email: guest.email }),
		});
		expect(invitationResponse.status).toBe(201);
		const invitation = (await invitationResponse.json()) as { id: string };

		const acceptanceResponse = await bookingsRoute.request(
			`/${bookingId}/invitations/${invitation.id}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: guestAuthorization,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: 'ACCEPTED' }),
			},
		);
		expect(acceptanceResponse.status).toBe(200);

		const visibleBookingsResponse = await bookingsRoute.request('/', {
			headers: { Authorization: guestAuthorization },
		});
		expect(visibleBookingsResponse.status).toBe(200);
		const visibleBookings = (await visibleBookingsResponse.json()) as Array<{ id: string }>;
		expect(visibleBookings.some((booking) => booking.id === bookingId)).toBe(true);

		const qrResponse = await bookingsRoute.request(`/${bookingId}/qr`, {
			method: 'POST',
			headers: { Authorization: authorization },
		});
		expect(qrResponse.status).toBe(200);
		const qrCode = (await qrResponse.json()) as {
			checkInUrl: string;
			qrCodeDataUrl: string;
		};
		expect(qrCode.qrCodeDataUrl.startsWith('data:image/png;base64,')).toBe(true);
		const qrParameters = new URLSearchParams(new URL(qrCode.checkInUrl).hash.slice(1));
		const token = qrParameters.get('token');
		if (!token) throw new Error('Expected QR token');

		const checkInResponse = await bookingsRoute.request(`/${bookingId}/check-in`, {
			method: 'POST',
			headers: {
				Authorization: guestAuthorization,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token }),
		});
		expect(checkInResponse.status).toBe(200);

		const participant = await db.query.bookingParticipants.findFirst({
			where: and(
				eq(bookingParticipants.bookingId, bookingId),
				eq(bookingParticipants.userId, guestUserId),
			),
		});
		expect(participant?.invitationStatus).toBe('ACCEPTED');
		expect(participant?.checkedInAt).toBeInstanceOf(Date);
	});

	function createBookingRequest(
		startAt: Date,
		endAt: Date,
		visibility: 'PUBLIC' | 'PRIVATE' = 'PRIVATE',
	): Promise<Response> {
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
				visibility,
			}),
		});
	}

	async function authorizationFor(user: {
		id: string;
		email: string;
		role: 'ADMIN' | 'USER';
	}): Promise<string> {
		return `Bearer ${await sign(
			{
				sub: user.id,
				email: user.email,
				role: user.role,
				exp: Math.floor(Date.now() / 1000) + 60,
			},
			process.env.JWT_SECRET!,
		)}`;
	}
});
