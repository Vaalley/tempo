import { Hono } from 'hono';
import { analyticsService } from './analytics.service';
import { adminGuard, authGuard, type AuthEnv } from '../../middlewares/auth.guard';

const app = new Hono<AuthEnv>();

// Protect all /analytics routes with JWT
app.use('*', authGuard);

app.use('*', adminGuard);

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
