import type { MiddlewareHandler } from 'hono';
import { readSession } from '../modules/auth/session';

// Middleware JWT pour protéger les routes
export const authGuard: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const payload = await readSession(c);
	if (!payload) return c.json({ error: 'Authentification requise' }, 401);
	c.set('jwtPayload', payload);
	await next();
};

// Type pour le payload JWT décodé
export interface JWTPayload {
	sub: string;
	email: string;
	role: 'ADMIN' | 'USER';
	exp: number;
}

export type AuthEnv = {
	Variables: {
		jwtPayload: JWTPayload;
		sessionCookieSecure?: boolean;
	};
};

export const adminGuard: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const payload = c.get('jwtPayload');

	if (payload.role !== 'ADMIN') {
		return c.json({ error: 'Admin access required' }, 403);
	}

	await next();
};
