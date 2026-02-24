import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { workspaces } from '../../db/schema';
import type { CreateWorkspaceDto } from './workspaces.dto';

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

	async delete(id: number): Promise<Workspace | undefined> {
		const [deleted] = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
		return deleted;
	},
};
