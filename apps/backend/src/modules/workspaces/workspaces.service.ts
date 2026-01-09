import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { workspaces } from '../../db/schema';
import type { CreateWorkspaceDto } from './workspaces.dto';

export const workspaceService = {
	async create(data: CreateWorkspaceDto) {
		const [workspace] = await db.insert(workspaces).values(data).returning();
		return workspace;
	},

	async getAll() {
		return await db.query.workspaces.findMany({
			orderBy: (workspaces, { asc }) => [asc(workspaces.name)],
		});
	},

	async getById(id: number) {
		return await db.query.workspaces.findFirst({
			where: eq(workspaces.id, id),
		});
	},

	async delete(id: number) {
		const [deleted] = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
		return deleted;
	},
};
