import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { and, eq, ne } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { closePostgres, db, pool } from '../db';
import { migrateDatabase } from '../db/migrate';
import { bookingParticipants, users, workspaces } from '../db/schema';
import { bookingParticipantsService } from '../modules/bookings/booking-participants.service';
import { bookingService } from '../modules/bookings/bookings.service';
import { workspaceService } from '../modules/workspaces/workspaces.service';

process.env.JWT_SECRET ??= 'capacity-integration-secret';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:5173';

const { default: bookingsRoute } = await import('../modules/bookings/bookings.route');
const { default: workspacesRoute } = await import('../modules/workspaces/workspaces.route');
const integrationEnabled = process.env.RUN_POSTGRES_INTEGRATION === 'true';
type TestUser = Pick<typeof users.$inferSelect, 'id' | 'email'>;

describe.skipIf(!integrationEnabled)('PostgreSQL capacity invariants', () => {
	let owner: TestUser;
	let guest: TestUser;
	let other: TestUser;
	let workspaceId: number;
	let userIds: string[] = [];

	beforeAll(async () => {
		if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
		await migrateDatabase();
	});

	beforeEach(async () => {
		userIds = [];
		owner = await createUser();
		guest = await createUser();
		other = await createUser();
		const [workspace] = await db
			.insert(workspaces)
			.values({
				name: `Capacity ${crypto.randomUUID()}`,
				type: 'MEETING_ROOM',
				capacity: 2,
			})
			.returning();
		workspaceId = workspace.id;
	});

	afterEach(async () => {
		if (workspaceId) await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
		for (const id of userIds) await db.delete(users).where(eq(users.id, id));
	});

	afterAll(closePostgres);

	it('rejects reaccepting a declined invitation after its place has been taken', async () => {
		const booking = await createBooking();
		const invitation = await bookingParticipantsService.invite(
			booking.id,
			owner.id,
			'USER',
			guest.email,
		);
		await bookingParticipantsService.respond(booking.id, invitation.id, guest.id, 'DECLINED');
		await bookingParticipantsService.joinPublic(booking.id, other.id);

		const response = await bookingsRoute.request(
			`/${booking.id}/invitations/${invitation.id}`,
			{
				method: 'PATCH',
				headers: await headers(guest),
				body: JSON.stringify({ status: 'ACCEPTED' }),
			},
		);
		expect(response.status).toBe(409);
		expect(await reservedPlaces(booking.id)).toBe(2);
		const declined = await db.query.bookingParticipants.findFirst({
			where: eq(bookingParticipants.id, invitation.id),
		});
		expect(declined?.invitationStatus).toBe('DECLINED');
	});

	it('requires a fresh invitation or public join after a refusal, even when a place is free', async () => {
		const booking = await createBooking();
		const invitation = await bookingParticipantsService.invite(
			booking.id,
			owner.id,
			'USER',
			guest.email,
		);
		await bookingParticipantsService.respond(booking.id, invitation.id, guest.id, 'DECLINED');
		const rejected = await bookingParticipantsService
			.respond(booking.id, invitation.id, guest.id, 'ACCEPTED')
			.then(
				() => null,
				(error: unknown) => error,
			);
		expect(rejected).toMatchObject({ message: 'INVITATION_DECLINED' });
		const renewed = await bookingParticipantsService.invite(
			booking.id,
			owner.id,
			'USER',
			guest.email,
		);
		expect(renewed.id).toBe(invitation.id);
		await bookingParticipantsService.respond(booking.id, renewed.id, guest.id, 'ACCEPTED');
		expect(await reservedPlaces(booking.id)).toBe(2);
		await bookingParticipantsService.respond(booking.id, renewed.id, guest.id, 'DECLINED');
		await bookingParticipantsService.joinPublic(booking.id, guest.id);
		expect(await reservedPlaces(booking.id)).toBe(2);
	});

	for (const timing of ['current', 'future'] as const) {
		it(`rejects reducing capacity below pending participants of a ${timing} booking`, async () => {
			const booking = await createBooking(timing);
			await bookingParticipantsService.invite(booking.id, owner.id, 'USER', guest.email);
			const response = await workspacesRoute.request(`/${workspaceId}`, {
				method: 'PATCH',
				headers: await headers(owner, 'ADMIN'),
				body: JSON.stringify({ capacity: 1, name: 'Must not change' }),
			});
			expect(response.status).toBe(409);
			const workspace = await workspaceService.getById(workspaceId);
			expect(workspace?.capacity).toBe(2);
			expect(workspace?.name).not.toBe('Must not change');
		});
	}

	it('rejects reducing capacity below accepted participants', async () => {
		const booking = await createBooking();
		await bookingParticipantsService.joinPublic(booking.id, guest.id);
		const rejected = await workspaceService.update(workspaceId, { capacity: 1 }).then(
			() => null,
			(error: unknown) => error,
		);
		expect(rejected).toMatchObject({ message: 'WORKSPACE_CAPACITY_CONFLICT' });
	});

	it('allows compatible reductions, ignores declined participants and preserves ended bookings', async () => {
		const past = await createBooking('past');
		await db
			.insert(bookingParticipants)
			.values({ bookingId: past.id, userId: guest.id, invitationStatus: 'ACCEPTED' });
		const future = await createBooking();
		const invitation = await bookingParticipantsService.invite(
			future.id,
			owner.id,
			'USER',
			guest.email,
		);
		await bookingParticipantsService.respond(future.id, invitation.id, guest.id, 'DECLINED');
		expect((await workspaceService.update(workspaceId, { capacity: 1 }))?.capacity).toBe(1);
		expect(await reservedPlaces(past.id)).toBe(2);
		expect(await reservedPlaces(future.id)).toBe(1);
		const rejected = await bookingParticipantsService.joinPublic(future.id, guest.id).then(
			() => null,
			(error: unknown) => error,
		);
		expect(rejected).toMatchObject({ message: 'BOOKING_FULL' });
	});

	it('checks each booking independently and permits increasing capacity', async () => {
		await workspaceService.update(workspaceId, { capacity: 3 });
		const first = await createBooking();
		const second = await createBooking('future', 3);
		await bookingParticipantsService.joinPublic(first.id, guest.id);
		await bookingParticipantsService.joinPublic(second.id, guest.id);
		expect((await workspaceService.update(workspaceId, { capacity: 2 }))?.capacity).toBe(2);
		expect((await workspaceService.update(workspaceId, { capacity: 4 }))?.capacity).toBe(4);
	});

	it('allows only one of two simultaneous admissions to the last place', async () => {
		const booking = await createBooking();
		const results = await Promise.allSettled([
			bookingParticipantsService.invite(booking.id, owner.id, 'USER', guest.email),
			bookingParticipantsService.joinPublic(booking.id, other.id),
		]);
		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		const rejected = results.find((result) => result.status === 'rejected');
		expect(rejected?.status === 'rejected' && rejected.reason.message).toBe('BOOKING_FULL');
		expect(await reservedPlaces(booking.id)).toBe(2);
	});

	for (const admission of ['invite', 'join'] as const) {
		it(`keeps capacity valid when a reduction races with ${admission}`, async () => {
			const booking = await createBooking();
			const results = await Promise.allSettled([
				workspaceService.update(workspaceId, { capacity: 1 }),
				admission === 'invite'
					? bookingParticipantsService.invite(booking.id, owner.id, 'USER', guest.email)
					: bookingParticipantsService.joinPublic(booking.id, guest.id),
			]);
			expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
			const rejected = results.find((result) => result.status === 'rejected');
			expect(rejected?.status).toBe('rejected');
			if (rejected?.status === 'rejected') {
				expect(['BOOKING_FULL', 'WORKSPACE_CAPACITY_CONFLICT']).toContain(
					rejected.reason.message,
				);
			}
			const workspace = await workspaceService.getById(workspaceId);
			expect(await reservedPlaces(booking.id)).toBeLessThanOrEqual(workspace!.capacity);
		});

		it(`waits for an in-flight ${admission} before deciding on a capacity reduction`, async () => {
			const booking = await createBooking();
			const blocker = await pool.connect();
			let admissionResult: Promise<unknown> | undefined;
			let reductionResult: Promise<unknown> | undefined;
			try {
				await blocker.query('BEGIN');
				// Hold the FK check at insertion, after the admission read the capacity.
				await blocker.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [guest.id]);
				admissionResult = (
					admission === 'invite'
						? bookingParticipantsService.invite(
								booking.id,
								owner.id,
								'USER',
								guest.email,
							)
						: bookingParticipantsService.joinPublic(booking.id, guest.id)
				).then(
					(result) => result,
					(error: unknown) => error,
				);
				await waitFor(async () => {
					const result = await pool.query<{ waiting: boolean }>(
						`SELECT EXISTS(SELECT 1 FROM pg_stat_activity
						 WHERE datname = current_database() AND wait_event_type = 'Lock'
						 AND query LIKE 'insert into "booking_participants"%') AS waiting`,
					);
					return result.rows[0].waiting;
				});
				let reductionFinished = false;
				reductionResult = workspaceService
					.update(workspaceId, { capacity: 1 })
					.then(
						(result) => result,
						(error: unknown) => error,
					)
					.finally(() => {
						reductionFinished = true;
					});
				await waitFor(async () => {
					const result = await pool.query<{ count: string }>(
						`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
						 AND wait_event_type = 'Lock'`,
					);
					return reductionFinished || Number(result.rows[0].count) >= 2;
				});
				await blocker.query('ROLLBACK');
				expect(await admissionResult).toMatchObject({ bookingId: booking.id });
				expect(await reductionResult).toMatchObject({
					message: 'WORKSPACE_CAPACITY_CONFLICT',
				});
				expect((await workspaceService.getById(workspaceId))?.capacity).toBe(2);
				expect(await reservedPlaces(booking.id)).toBe(2);
			} finally {
				await blocker.query('ROLLBACK');
				blocker.release();
				await Promise.allSettled([admissionResult, reductionResult]);
			}
		});
	}

	async function waitFor(condition: () => Promise<boolean>): Promise<void> {
		const deadline = Date.now() + 2000;
		while (!(await condition())) {
			if (Date.now() >= deadline) throw new Error('Expected database lock was not reached');
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	async function createUser(): Promise<TestUser> {
		const [user] = await db
			.insert(users)
			.values({
				email: `capacity-${crypto.randomUUID()}@tempo.test`,
				password: 'unused-test-hash',
			})
			.returning({ id: users.id, email: users.email });
		userIds.push(user.id);
		return user;
	}

	async function createBooking(
		timing: 'past' | 'current' | 'future' = 'future',
		offsetHours = 1,
	) {
		const now = Date.now();
		const start = timing === 'past' ? -2 : timing === 'current' ? -0.5 : offsetHours;
		return bookingService.create(owner.id, {
			workspaceId,
			visibility: 'PUBLIC',
			startAt: new Date(now + start * 3600000).toISOString(),
			endAt: new Date(now + (start + 1) * 3600000).toISOString(),
		});
	}

	async function reservedPlaces(bookingId: string): Promise<number> {
		const participants = await db
			.select()
			.from(bookingParticipants)
			.where(
				and(
					eq(bookingParticipants.bookingId, bookingId),
					ne(bookingParticipants.invitationStatus, 'DECLINED'),
				),
			);
		return participants.length;
	}

	async function headers(user: TestUser, role: 'USER' | 'ADMIN' = 'USER') {
		const token = await sign(
			{ sub: user.id, email: user.email, role, exp: Math.floor(Date.now() / 1000) + 300 },
			process.env.JWT_SECRET!,
		);
		return { Cookie: `tempo_session=${token}`, 'Content-Type': 'application/json' };
	}
});
