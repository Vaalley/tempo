import { and, count, eq, gt, ne, sql } from 'drizzle-orm';
import { db } from '../../db';
import { bookingParticipants, bookings, workspaces } from '../../db/schema';
import type { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspaces.dto';

type Workspace = typeof workspaces.$inferSelect;

export const workspaceService = {
	async create(data: CreateWorkspaceDto): Promise<Workspace> {
		const [workspace] = await db.insert(workspaces).values(data).returning();
		return workspace;
	},

	async getAll(): Promise<Workspace[]> {
		return await db.query.workspaces.findMany({
			orderBy: (workspaceTable, { asc }) => [asc(workspaceTable.name)],
		});
	},

	async getById(id: number): Promise<Workspace | undefined> {
		return await db.query.workspaces.findFirst({
			where: eq(workspaces.id, id),
		});
	},

	async update(id: number, data: UpdateWorkspaceDto): Promise<Workspace | undefined> {
		return await db.transaction(async (transaction) => {
			// Admissions acquire this same lock before reading the capacity.
			await transaction.execute(
				sql`SELECT "id" FROM "workspaces" WHERE "id" = ${id} FOR UPDATE`,
			);
			const workspace = await transaction.query.workspaces.findFirst({
				where: eq(workspaces.id, id),
			});
			if (!workspace) return undefined;

			if (data.capacity !== undefined && data.capacity < workspace.capacity) {
				const conflicts = await transaction
					.select({ id: bookings.id })
					.from(bookings)
					.innerJoin(bookingParticipants, eq(bookingParticipants.bookingId, bookings.id))
					.where(
						and(
							eq(bookings.workspaceId, id),
							gt(bookings.endAt, new Date()),
							ne(bookingParticipants.invitationStatus, 'DECLINED'),
						),
					)
					.groupBy(bookings.id)
					.having(gt(count(), data.capacity))
					.limit(1);
				if (conflicts.length > 0) throw new Error('WORKSPACE_CAPACITY_CONFLICT');
			}

			const [updated] = await transaction
				.update(workspaces)
				.set(data)
				.where(eq(workspaces.id, id))
				.returning();
			return updated;
		});
	},

	async delete(id: number): Promise<Workspace | undefined> {
		const [deleted] = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
		return deleted;
	},
};
