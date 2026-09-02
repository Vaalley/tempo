import { and, eq, gt, inArray, lt, ne, or } from 'drizzle-orm';
import { db } from '../../db';
import { bookingParticipants, bookings, workspaces } from '../../db/schema';
import type { CreateBookingDto } from './bookings.dto';

type Booking = typeof bookings.$inferSelect;

const BOOKING_OVERLAP_SQL_STATE = '23P01';
const BOOKING_OVERLAP_CONSTRAINT = 'bookings_workspace_time_exclusion';

function isBookingOverlapConstraintError(error: unknown): boolean {
	let currentError = error;
	const visitedErrors = new Set<object>();

	while (
		typeof currentError === 'object' &&
		currentError !== null &&
		!visitedErrors.has(currentError)
	) {
		visitedErrors.add(currentError);

		if (
			'code' in currentError &&
			currentError.code === BOOKING_OVERLAP_SQL_STATE &&
			'constraint' in currentError &&
			currentError.constraint === BOOKING_OVERLAP_CONSTRAINT
		) {
			return true;
		}

		currentError = 'cause' in currentError ? currentError.cause : undefined;
	}

	return false;
}

export const bookingService = {
	/**
	 * Checks if a booking overlaps with existing bookings
	 * Overlap logic:
	 * - New booking starts before an existing one ends AND
	 * - New booking ends after an existing one starts
	 */
	async checkOverlap(
		workspaceId: number,
		startAt: Date,
		endAt: Date,
		excludeBookingId?: string,
	): Promise<boolean> {
		const conditions = [
			eq(bookings.workspaceId, workspaceId),
			// Overlap: (startAt < existing.endAt) AND (endAt > existing.startAt)
			lt(bookings.startAt, endAt),
			gt(bookings.endAt, startAt),
		];

		// If updating a booking, exclude its own ID
		if (excludeBookingId) {
			const overlapping = await db.query.bookings.findFirst({
				where: and(...conditions, ne(bookings.id, excludeBookingId)),
			});
			return !!overlapping;
		}

		const overlapping = await db.query.bookings.findFirst({
			where: and(...conditions),
		});

		return !!overlapping;
	},

	async create(userId: string, data: CreateBookingDto): Promise<Booking> {
		const startAt = new Date(data.startAt);
		const endAt = new Date(data.endAt);

		// Check that the workspace exists
		const workspace = await db.query.workspaces.findFirst({
			where: eq(workspaces.id, data.workspaceId),
		});

		if (!workspace) {
			throw new Error('WORKSPACE_NOT_FOUND');
		}

		// Check for overlaps
		const hasOverlap = await this.checkOverlap(data.workspaceId, startAt, endAt);

		if (hasOverlap) {
			throw new Error('BOOKING_OVERLAP');
		}

		try {
			return await db.transaction(async (transaction) => {
				const [booking] = await transaction
					.insert(bookings)
					.values({
						userId,
						workspaceId: data.workspaceId,
						startAt,
						endAt,
						visibility: data.visibility,
					})
					.returning();

				await transaction.insert(bookingParticipants).values({
					bookingId: booking.id,
					userId,
					role: 'OWNER',
					invitationStatus: 'ACCEPTED',
					respondedAt: booking.createdAt ?? new Date(),
				});

				return booking;
			});
		} catch (error) {
			// PostgreSQL remains the source of truth if two requests pass the
			// application-level overlap check at the same time.
			if (isBookingOverlapConstraintError(error)) {
				throw new Error('BOOKING_OVERLAP', { cause: error });
			}

			throw error;
		}
	},

	async getByUser(userId: string) {
		const memberships = await db.query.bookingParticipants.findMany({
			where: and(
				eq(bookingParticipants.userId, userId),
				ne(bookingParticipants.invitationStatus, 'DECLINED'),
			),
			columns: { bookingId: true },
		});
		const membershipIds = memberships.map((membership) => membership.bookingId);
		const visibilityConditions = [
			eq(bookings.visibility, 'PUBLIC'),
			eq(bookings.userId, userId),
		];

		if (membershipIds.length > 0) {
			visibilityConditions.push(inArray(bookings.id, membershipIds));
		}

		return await db.query.bookings.findMany({
			where: or(...visibilityConditions),
			with: {
				workspace: true,
				user: {
					columns: {
						id: true,
						email: true,
						role: true,
					},
				},
				participants: {
					with: {
						user: {
							columns: {
								id: true,
								email: true,
								role: true,
							},
						},
					},
				},
			},
			orderBy: (bookingTable, { desc }) => [desc(bookingTable.startAt)],
		});
	},

	async getAll() {
		return await db.query.bookings.findMany({
			with: {
				workspace: true,
				user: {
					columns: {
						id: true,
						email: true,
						role: true,
					},
				},
				participants: {
					with: {
						user: {
							columns: {
								id: true,
								email: true,
								role: true,
							},
						},
					},
				},
			},
			orderBy: (bookingTable, { desc }) => [desc(bookingTable.startAt)],
		});
	},

	async delete(id: string, userId: string, role: 'ADMIN' | 'USER' = 'USER'): Promise<Booking> {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, id),
		});

		if (!booking) {
			throw new Error('BOOKING_NOT_FOUND');
		}

		if (role !== 'ADMIN' && booking.userId !== userId) {
			throw new Error('UNAUTHORIZED');
		}

		const [deleted] = await db.delete(bookings).where(eq(bookings.id, id)).returning();
		return deleted;
	},
};
