import { describe, expect, it } from 'bun:test';
import { sign } from 'hono/jwt';

process.env.JWT_SECRET = 'test-jwt-secret';

const [{ default: auditRoute }, { default: workspacesRoute }] = await Promise.all([
	import('./audit/audit.route'),
	import('./workspaces/workspaces.route'),
]);

async function authorizationHeader(role: 'ADMIN' | 'USER'): Promise<string> {
	const token = await sign(
		{
			sub: `${role.toLowerCase()}-id`,
			email: `${role.toLowerCase()}@example.com`,
			role,
			exp: Math.floor(Date.now() / 1000) + 60,
		},
		'test-jwt-secret',
	);

	return `Bearer ${token}`;
}

describe('admin routes', () => {
	it('should reject unauthenticated audit access', async () => {
		const response = await auditRoute.request('/');

		expect(response.status).toBe(401);
	});

	it('should reject audit access for a standard user', async () => {
		const response = await auditRoute.request('/', {
			headers: { Authorization: await authorizationHeader('USER') },
		});

		expect(response.status).toBe(403);
	});

	it('should reject workspace updates from a standard user', async () => {
		const response = await workspacesRoute.request('/1', {
			method: 'PATCH',
			headers: {
				Authorization: await authorizationHeader('USER'),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: 'Interdit' }),
		});

		expect(response.status).toBe(403);
	});

	it('should reject an empty workspace update from an admin', async () => {
		const response = await workspacesRoute.request('/1', {
			method: 'PATCH',
			headers: {
				Authorization: await authorizationHeader('ADMIN'),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}),
		});

		expect(response.status).toBe(400);
	});
});
