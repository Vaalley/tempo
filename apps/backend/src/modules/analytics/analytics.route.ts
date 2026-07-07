import { Hono } from 'hono';
import { analyticsService } from './analytics.service';
import { authGuard } from '../../middlewares/auth.guard';
import type { JWTPayload } from '../../middlewares/auth.guard';

const app = new Hono();

// Protect all /analytics routes with JWT
app.use('*', authGuard);

// Admin-only guard
app.use('*', async (c, next) => {
	const payload = c.get('jwtPayload') as JWTPayload;
	if (payload.role !== 'ADMIN') {
		return c.json({ error: 'Admin access required' }, 403);
	}
	await next();
});

// GET /analytics/overview - Global occupancy stats
app.get('/overview', async (c) => {
	try {
		const overview = await analyticsService.getOverview();
		return c.json(overview);
	} catch {
		return c.json({ error: 'Server error' }, 500);
	}
});

// GET /analytics/workspaces - Per-workspace utilization
app.get('/workspaces', async (c) => {
	try {
		const stats = await analyticsService.getWorkspaceStats();
		return c.json(stats);
	} catch {
		return c.json({ error: 'Server error' }, 500);
	}
});

export default app;
