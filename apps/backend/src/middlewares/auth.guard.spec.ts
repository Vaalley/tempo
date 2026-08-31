import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import type { AuthEnv, JWTPayload } from './auth.guard';

process.env.JWT_SECRET = 'test-jwt-secret';
const { adminGuard } = await import('./auth.guard');

const app = new Hono<AuthEnv>();

app.use('*', async (c, next) => {
	const role = c.req.header('x-test-role') === 'ADMIN' ? 'ADMIN' : 'USER';
	const payload: JWTPayload = {
		sub: 'user-id',
		email: 'user@example.com',
		role,
		exp: 0,
	};

	c.set('jwtPayload', payload);
	await next();
});

app.use('*', adminGuard);
app.get('/protected', (c) => c.json({ ok: true }));

describe('adminGuard', () => {
	it('denies a USER payload', async () => {
		const response = await app.request('/protected', {
			headers: { 'x-test-role': 'USER' },
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Admin access required' });
	});

	it('allows an ADMIN payload', async () => {
		const response = await app.request('/protected', {
			headers: { 'x-test-role': 'ADMIN' },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
	});
});
