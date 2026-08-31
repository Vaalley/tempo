import { jwt } from 'hono/jwt';
import type { MiddlewareHandler } from 'hono';
import { authService } from '../modules/auth/auth.service';

// Middleware JWT pour protéger les routes
export const authGuard = jwt({
	secret: authService.getSecret(),
	alg: 'HS256',
});

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
	};
};

export const adminGuard: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const payload = c.get('jwtPayload');

	if (payload.role !== 'ADMIN') {
		return c.json({ error: 'Admin access required' }, 403);
	}

	await next();
};
