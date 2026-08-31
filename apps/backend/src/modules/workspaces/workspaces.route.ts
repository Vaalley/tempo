import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { workspaceService } from './workspaces.service';
import { adminGuard, authGuard, type AuthEnv } from '../../middlewares/auth.guard';
import { createWorkspaceSchema, updateWorkspaceSchema } from './workspaces.dto';
import { auditService } from '../audit/audit.service';

const app = new Hono<AuthEnv>();

// Protect all /workspaces routes with JWT
app.use('*', authGuard);

const paramIdSchema = z.object({
	id: z.coerce.number().int().positive(),
});

// GET /workspaces - List all workspaces
app.get('/', async (c) => {
	const workspaces = await workspaceService.getAll();
	return c.json(workspaces);
});

// GET /workspaces/:id - Get a workspace by ID
app.get('/:id', zValidator('param', paramIdSchema), async (c) => {
	const { id } = c.req.valid('param');

	const workspace = await workspaceService.getById(id);

	if (!workspace) {
		return c.json({ error: 'Workspace not found' }, 404);
	}

	return c.json(workspace);
});

// POST /workspaces - Create a workspace
app.post('/', adminGuard, zValidator('json', createWorkspaceSchema), async (c) => {
	const data = c.req.valid('json');
	const workspace = await workspaceService.create(data);
	return c.json(workspace, 201);
});

// PATCH /workspaces/:id - Update a workspace
app.patch(
	'/:id',
	adminGuard,
	zValidator('param', paramIdSchema),
	zValidator('json', updateWorkspaceSchema),
	async (c) => {
		const { id } = c.req.valid('param');
		const data = c.req.valid('json');
		const workspace = await workspaceService.update(id, data);

		if (!workspace) {
			return c.json({ error: 'Workspace not found' }, 404);
		}

		return c.json(workspace);
	},
);

// DELETE /workspaces/:id - Delete a workspace
app.delete('/:id', adminGuard, zValidator('param', paramIdSchema), async (c) => {
	const { id } = c.req.valid('param');
	const payload = c.get('jwtPayload');

	const deleted = await workspaceService.delete(id);

	if (!deleted) {
		return c.json({ error: 'Workspace not found' }, 404);
	}

	await auditService.logDeletion('workspace', id, deleted as Record<string, unknown>, {
		userId: payload.sub,
		email: payload.email,
		role: payload.role,
	});

	return c.json({ message: 'Workspace deleted', workspace: deleted });
});

export default app;
