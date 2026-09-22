import type { MiddlewareHandler } from 'hono';

// A custom header forces a CORS preflight for cross-origin requests. Also
// check Origin on the actual mutation: CORS alone does not prevent writes.
export function csrfGuard(frontendOrigin: string): MiddlewareHandler {
	return async (c, next) => {
		if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
			if (
				c.req.header('Origin') !== frontendOrigin ||
				c.req.header('X-CSRF-Protection') !== '1'
			) {
				return c.json({ error: 'Origine de la requête non autorisée' }, 403);
			}
		}
		await next();
	};
}
