import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { adminGuard, authGuard, type AuthEnv } from '../../middlewares/auth.guard';
import { auditService } from './audit.service';

const app = new Hono<AuthEnv>();

const listAuditLogsSchema = z.object({
	limit: z.coerce.number().int().min(1).max(200).default(100),
});

app.use('*', authGuard);
app.use('*', adminGuard);

// GET /audit - List the latest audit logs
app.get('/', zValidator('query', listAuditLogsSchema), async (c) => {
	try {
		const { limit } = c.req.valid('query');
		const logs = await auditService.getAll(limit);
		return c.json(logs);
	} catch {
		return c.json({ error: 'Server error' }, 500);
	}
});

export default app;
