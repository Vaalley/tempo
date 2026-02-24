import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { workspaceService } from './workspaces.service';
import { authGuard } from '../../middlewares/auth.guard';
import { createWorkspaceSchema } from './workspaces.dto';
import { auditService } from '../audit/audit.service';

const app = new Hono();

// Protège toutes les routes /workspaces avec le JWT
app.use('*', authGuard);

const paramIdSchema = z.object({
	id: z.coerce.number(),
});

// GET /workspaces - Lister tous les espaces
app.get('/', async (c) => {
	const workspaces = await workspaceService.getAll();
	return c.json(workspaces);
});

// GET /workspaces/:id - Récupérer un espace par ID
app.get('/:id', zValidator('param', paramIdSchema), async (c) => {
	const { id } = c.req.valid('param');

	const workspace = await workspaceService.getById(id);

	if (!workspace) {
		return c.json({ error: 'Espace non trouvé' }, 404);
	}

	return c.json(workspace);
});

// POST /workspaces - Créer un espace
app.post('/', zValidator('json', createWorkspaceSchema), async (c) => {
	const data = c.req.valid('json');
	const workspace = await workspaceService.create(data);
	return c.json(workspace, 201);
});

// DELETE /workspaces/:id - Supprimer un espace
app.delete('/:id', zValidator('param', paramIdSchema), async (c) => {
	const { id } = c.req.valid('param');
	const payload = c.get('jwtPayload');

	const deleted = await workspaceService.delete(id);

	if (!deleted) {
		return c.json({ error: 'Espace non trouvé' }, 404);
	}

	await auditService.logDeletion('workspace', id, deleted as Record<string, unknown>, {
		userId: payload.sub,
		email: payload.email,
		role: payload.role,
	});

	return c.json({ message: 'Espace supprimé', workspace: deleted });
});

export default app;
