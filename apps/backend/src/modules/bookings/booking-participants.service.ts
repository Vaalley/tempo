import { and, count, eq, ne, sql } from 'drizzle-orm';
import { db } from '../../db';
import { bookingParticipants, bookings, users } from '../../db/schema';
import type { InvitationResponseStatus } from './bookings.dto';

type UserRole = 'ADMIN' | 'USER';

async function countReservedPlaces(
	transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
	bookingId: string,
): Promise<number> {
	const [result] = await transaction
		.select({ value: count() })
		.from(bookingParticipants)
		.where(
			and(
				eq(bookingParticipants.bookingId, bookingId),
				ne(bookingParticipants.invitationStatus, 'DECLINED'),
			),
		);

	return result.value;
}

export const bookingParticipantsService = {
	async invite(bookingId: string, actorId: string, actorRole: UserRole, email: string) {
		return await db.transaction(async (transaction) => {
			await transaction.execute(
				sql`SELECT "id" FROM "bookings" WHERE "id" = ${bookingId} FOR UPDATE`,
			);
			const booking = await transaction.query.bookings.findFirst({
				where: eq(bookings.id, bookingId),
				with: { workspace: true },
			});

			if (!booking) throw new Error('BOOKING_NOT_FOUND');
			if (actorRole !== 'ADMIN' && booking.userId !== actorId) {
				throw new Error('UNAUTHORIZED');
			}
			if (booking.endAt <= new Date()) throw new Error('BOOKING_ENDED');

			const invitedUser = await transaction.query.users.findFirst({
				where: eq(users.email, email),
				columns: { id: true, email: true, role: true },
			});

			if (!invitedUser) throw new Error('USER_NOT_FOUND');
			if (invitedUser.id === booking.userId) throw new Error('OWNER_ALREADY_PARTICIPANT');

			const existing = await transaction.query.bookingParticipants.findFirst({
				where: and(
					eq(bookingParticipants.bookingId, bookingId),
					eq(bookingParticipants.userId, invitedUser.id),
				),
			});

			if (existing && existing.invitationStatus !== 'DECLINED') {
				throw new Error('PARTICIPANT_EXISTS');
			}

			const reservedPlaces = await countReservedPlaces(transaction, bookingId);
			if (reservedPlaces >= booking.workspace.capacity) throw new Error('BOOKING_FULL');

			if (existing) {
				const [participant] = await transaction
					.update(bookingParticipants)
					.set({
						invitationStatus: 'PENDING',
						invitedAt: new Date(),
						respondedAt: null,
						checkedInAt: null,
					})
					.where(eq(bookingParticipants.id, existing.id))
					.returning();

				return { ...participant, user: invitedUser };
			}

			const [participant] = await transaction
				.insert(bookingParticipants)
				.values({
					bookingId,
					userId: invitedUser.id,
					role: 'GUEST',
					invitationStatus: 'PENDING',
				})
				.returning();

			return { ...participant, user: invitedUser };
		});
	},

	async respond(
		bookingId: string,
		participantId: string,
		userId: string,
		status: InvitationResponseStatus,
	) {
		const participant = await db.query.bookingParticipants.findFirst({
			where: and(
				eq(bookingParticipants.id, participantId),
				eq(bookingParticipants.bookingId, bookingId),
			),
			with: { booking: true },
		});

		if (!participant) throw new Error('PARTICIPANT_NOT_FOUND');
		if (participant.userId !== userId || participant.role !== 'GUEST') {
			throw new Error('UNAUTHORIZED');
		}
		if (participant.booking.endAt <= new Date()) throw new Error('BOOKING_ENDED');

		const [updated] = await db
			.update(bookingParticipants)
			.set({
				invitationStatus: status,
				respondedAt: new Date(),
				checkedInAt: status === 'DECLINED' ? null : participant.checkedInAt,
			})
			.where(eq(bookingParticipants.id, participantId))
			.returning();

		return updated;
	},

	async joinPublic(bookingId: string, userId: string) {
		return await db.transaction(async (transaction) => {
			await transaction.execute(
				sql`SELECT "id" FROM "bookings" WHERE "id" = ${bookingId} FOR UPDATE`,
			);
			const booking = await transaction.query.bookings.findFirst({
				where: eq(bookings.id, bookingId),
				with: { workspace: true },
			});

			if (!booking) throw new Error('BOOKING_NOT_FOUND');
			if (booking.visibility !== 'PUBLIC') throw new Error('BOOKING_PRIVATE');
			if (booking.endAt <= new Date()) throw new Error('BOOKING_ENDED');

			const existing = await transaction.query.bookingParticipants.findFirst({
				where: and(
					eq(bookingParticipants.bookingId, bookingId),
					eq(bookingParticipants.userId, userId),
				),
			});

			if (existing && existing.invitationStatus !== 'DECLINED') {
				throw new Error('PARTICIPANT_EXISTS');
			}

			const reservedPlaces = await countReservedPlaces(transaction, bookingId);
			if (reservedPlaces >= booking.workspace.capacity) throw new Error('BOOKING_FULL');

			if (existing) {
				const [participant] = await transaction
					.update(bookingParticipants)
					.set({
						invitationStatus: 'ACCEPTED',
						respondedAt: new Date(),
						checkedInAt: null,
					})
					.where(eq(bookingParticipants.id, existing.id))
					.returning();

				return participant;
			}

			const [participant] = await transaction
				.insert(bookingParticipants)
				.values({
					bookingId,
					userId,
					role: 'GUEST',
					invitationStatus: 'ACCEPTED',
					respondedAt: new Date(),
				})
				.returning();

			return participant;
		});
	},
};
