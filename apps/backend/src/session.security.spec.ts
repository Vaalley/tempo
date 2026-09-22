import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { sign } from 'hono/jwt';
import { authService } from './modules/auth/auth.service';
import { createApp } from './app';

process.env.JWT_SECRET = 'test-jwt-secret';
const origin = 'https://tempo.example.com';
const headers = { Origin: origin, 'X-CSRF-Protection': '1' };
const user = { id: 'user-1', email: 'user@tempo.test', role: 'USER' as const };
const app = () =>
	createApp({
		frontendOrigin: origin,
		authRateLimit: { limit: 20, windowMs: 60000 },
		trustProxy: false,
		logger: false,
	});
const token = (exp = Math.floor(Date.now() / 1000) + 3600) =>
	sign(
		{ sub: user.id, email: user.email, role: user.role, exp },
		authService.getSecret(),
		'HS256',
	);
afterEach(() => mock.restore());

describe('cookie authentication and CSRF', () => {
	it('sets a protected cookie at login and never returns the JWT in JSON', async () => {
		spyOn(authService, 'login').mockResolvedValue({ token: await token(), user });
		const response = await app().request('/auth/login', {
			method: 'POST',
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: user.email, password: 'password123' }),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ user });
		const cookie = response.headers.get('Set-Cookie') ?? '';
		for (const attribute of [
			'tempo_session=',
			'HttpOnly',
			'Secure',
			'SameSite=Strict',
			'Path=/',
			'Max-Age=86400',
		])
			expect(cookie).toContain(attribute);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		const restored = await app().request('/auth/session', {
			headers: { Cookie: cookie.split(';')[0] },
		});
		expect(await restored.json()).toEqual({ user });
	});
	it('supports local HTTP development without the Secure attribute', async () => {
		spyOn(authService, 'login').mockResolvedValue({ token: await token(), user });
		const local = createApp({
			frontendOrigin: 'http://localhost:5173',
			authRateLimit: { limit: 10, windowMs: 60000 },
			trustProxy: false,
			logger: false,
		});
		const response = await local.request('/auth/login', {
			method: 'POST',
			headers: {
				...headers,
				Origin: 'http://localhost:5173',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email: user.email, password: 'password123' }),
		});
		expect(response.status).toBe(200);
		expect(response.headers.get('Set-Cookie')).not.toContain('Secure');
		expect(response.headers.get('Set-Cookie')).toContain('HttpOnly');
	});
	it('rejects missing, forged and expired cookies on protected routes', async () => {
		for (const value of ['', 'forged', await token(1)]) {
			const response = await app().request('/bookings', {
				headers: { Cookie: `tempo_session=${value}` },
			});
			expect(response.status).toBe(401);
			const session = await app().request('/auth/session', {
				headers: { Cookie: `tempo_session=${value}` },
			});
			expect(await session.json()).toEqual({ user: null });
		}
	});
	it('does not accept a legacy Bearer header', async () => {
		const response = await app().request('/bookings', {
			headers: { Authorization: `Bearer ${await token()}` },
		});
		expect(response.status).toBe(401);
	});
	it('clears the cookie on logout with matching attributes', async () => {
		const response = await app().request('/auth/logout', { method: 'POST', headers });
		expect(response.status).toBe(200);
		for (const attribute of ['Max-Age=0', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/'])
			expect(response.headers.get('Set-Cookie')).toContain(attribute);
	});
	it('rejects unsafe requests without both the trusted origin and custom header', async () => {
		for (const path of ['/auth/login', '/auth/register', '/auth/logout', '/bookings']) {
			for (const unsafeHeaders of [
				{},
				{ Origin: origin },
				{ 'X-CSRF-Protection': '1' },
				{ ...headers, Origin: 'https://evil.example.com' },
				{ ...headers, Origin: 'null' },
			]) {
				expect(
					(await app().request(path, { method: 'POST', headers: unsafeHeaders })).status,
				).toBe(403);
			}
		}
		for (const method of ['PUT', 'PATCH', 'DELETE'])
			expect((await app().request('/bookings/example', { method })).status).toBe(403);
	});
	it('allows credentialed preflight from the configured origin', async () => {
		const response = await app().request('/auth/login', {
			method: 'OPTIONS',
			headers: {
				Origin: origin,
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'content-type,x-csrf-protection',
			},
		});
		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-CSRF-Protection');
	});
});
