import { Hono } from 'hono';
import type { Context } from 'hono';
import { getConnInfo } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { HttpSecurityConfig } from './config/security.config';
import analyticsRoute from './modules/analytics/analytics.route';
import auditRoute from './modules/audit/audit.route';
import authRoute from './modules/auth/auth.route';
import bookingsRoute from './modules/bookings/bookings.route';
import usersRoute from './modules/users/users.route';
import workspacesRoute from './modules/workspaces/workspaces.route';
import { rateLimit } from './middlewares/rate-limit';

export interface AppOptions extends HttpSecurityConfig {
	logger?: boolean;
}

function getClientAddress(context: Context, trustProxy: boolean): string {
	if (trustProxy) {
		const forwardedAddress = context.req.header('x-forwarded-for')?.split(',')[0]?.trim();

		if (forwardedAddress) {
			return forwardedAddress;
		}
	}

	try {
		return getConnInfo(context).remote.address ?? 'unknown';
	} catch {
		return 'unknown';
	}
}

export function createApp(options: AppOptions) {
	const app = new Hono();

	if (options.logger !== false) {
		app.use('*', logger());
	}

	app.use(
		'*',
		secureHeaders({
			contentSecurityPolicy: {
				defaultSrc: ["'none'"],
				frameAncestors: ["'none'"],
			},
			permissionsPolicy: {
				camera: [],
				geolocation: [],
				microphone: [],
			},
		}),
	);
	app.use(
		'*',
		cors({
			origin: options.frontendOrigin,
			allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
			allowHeaders: ['Authorization', 'Content-Type'],
			maxAge: 600,
		}),
	);
	app.use('/auth/*', async (context, next) => {
		await next();
		context.header('Cache-Control', 'no-store');
	});
	app.use(
		'/auth/*',
		rateLimit({
			...options.authRateLimit,
			keyGenerator: (context) => getClientAddress(context, options.trustProxy),
		}),
	);

	const routes = app
		.route('/auth', authRoute)
		.route('/users', usersRoute)
		.route('/workspaces', workspacesRoute)
		.route('/bookings', bookingsRoute)
		.route('/analytics', analyticsRoute)
		.route('/audit', auditRoute);

	routes.get('/health', (context) => context.text('OK'));

	return routes;
}
