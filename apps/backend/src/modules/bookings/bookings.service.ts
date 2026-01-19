import { and, eq, lt, gt } from 'drizzle-orm';
import { db } from '../../db';
import { bookings, workspaces } from '../../db/schema';
import type { CreateBookingDto } from './bookings.dto';

export const bookingService = {
	/**
	 * Vérifie si une réservation chevauche des réservations existantes
	 * Logique de chevauchement :
	 * - Nouvelle réservation commence avant qu'une existante se termine ET
	 * - Nouvelle réservation se termine après qu'une existante commence
	 */
	async checkOverlap(workspaceId: number, startAt: Date, endAt: Date, excludeBookingId?: string) {
		const conditions = [
			eq(bookings.workspaceId, workspaceId),
			// Chevauchement : (startAt < existing.endAt) AND (endAt > existing.startAt)
			lt(bookings.startAt, endAt),
			gt(bookings.endAt, startAt),
		];

		// Si on met à jour une réservation, exclure son propre ID
		if (excludeBookingId) {
			const overlapping = await db.query.bookings.findFirst({
				where: and(...conditions, eq(bookings.id, excludeBookingId)),
			});
			return !!overlapping;
		}

		const overlapping = await db.query.bookings.findFirst({
			where: and(...conditions),
		});

		return !!overlapping;
	},

	async create(userId: string, data: CreateBookingDto) {
		const startAt = new Date(data.startAt);
		const endAt = new Date(data.endAt);

		// Vérifier que le workspace existe
		const workspace = await db.query.workspaces.findFirst({
			where: eq(workspaces.id, data.workspaceId),
		});

		if (!workspace) {
			throw new Error('WORKSPACE_NOT_FOUND');
		}

		// Vérifier les chevauchements
		const hasOverlap = await this.checkOverlap(data.workspaceId, startAt, endAt);

		if (hasOverlap) {
			throw new Error('BOOKING_OVERLAP');
		}

		const [booking] = await db
			.insert(bookings)
			.values({
				userId,
				workspaceId: data.workspaceId,
				startAt,
				endAt,
			})
			.returning();

		return booking;
	},

	async getByUser(userId: string) {
		return await db.query.bookings.findMany({
			where: eq(bookings.userId, userId),
			with: {
				workspace: true,
			},
			orderBy: (bookings, { desc }) => [desc(bookings.startAt)],
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
			},
			orderBy: (bookings, { desc }) => [desc(bookings.startAt)],
		});
	},

	async delete(id: string, userId: string) {
		// Vérifier que la réservation appartient à l'utilisateur
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, id),
		});

		if (!booking) {
			throw new Error('BOOKING_NOT_FOUND');
		}

		if (booking.userId !== userId) {
			throw new Error('UNAUTHORIZED');
		}

		const [deleted] = await db.delete(bookings).where(eq(bookings.id, id)).returning();
		return deleted;
	},
};
