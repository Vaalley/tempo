import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { rateLimit } from './rate-limit';

function createTestApp(now: () => number): Hono {
	const app = new Hono();

	app.use(
		'*',
		rateLimit({
			limit: 2,
			windowMs: 60_000,
			keyGenerator: (context) => context.req.header('x-client') ?? 'anonymous',
			now,
		}),
	);
	app.post('/', (context) => context.json({ ok: true }));

	return app;
}

describe('rateLimit', () => {
	it('returns 429 with retry information once the limit is reached', async () => {
		const app = createTestApp(() => 1_000);

		const firstResponse = await app.request('/', {
			method: 'POST',
			headers: { 'x-client': 'client-a' },
		});
		const secondResponse = await app.request('/', {
			method: 'POST',
			headers: { 'x-client': 'client-a' },
		});
		const blockedResponse = await app.request('/', {
			method: 'POST',
			headers: { 'x-client': 'client-a' },
		});

		expect(firstResponse.status).toBe(200);
		expect(firstResponse.headers.get('RateLimit-Remaining')).toBe('1');
		expect(secondResponse.headers.get('RateLimit-Remaining')).toBe('0');
		expect(blockedResponse.status).toBe(429);
		expect(blockedResponse.headers.get('Retry-After')).toBe('60');
		expect(await blockedResponse.json()).toEqual({
			error: 'Trop de tentatives. Réessayez plus tard.',
		});
	});

	it('uses independent counters for each key', async () => {
		const app = createTestApp(() => 1_000);

		await app.request('/', { method: 'POST', headers: { 'x-client': 'client-a' } });
		await app.request('/', { method: 'POST', headers: { 'x-client': 'client-a' } });
		const otherClientResponse = await app.request('/', {
			method: 'POST',
			headers: { 'x-client': 'client-b' },
		});

		expect(otherClientResponse.status).toBe(200);
		expect(otherClientResponse.headers.get('RateLimit-Remaining')).toBe('1');
	});

	it('resets the counter after the configured window', async () => {
		let currentTime = 1_000;
		const app = createTestApp(() => currentTime);

		await app.request('/', { method: 'POST' });
		await app.request('/', { method: 'POST' });
		currentTime = 61_000;

		const response = await app.request('/', { method: 'POST' });

		expect(response.status).toBe(200);
		expect(response.headers.get('RateLimit-Remaining')).toBe('1');
	});

	it('does not count CORS preflight requests', async () => {
		const app = createTestApp(() => 1_000);

		await app.request('/', { method: 'OPTIONS' });
		const response = await app.request('/', { method: 'POST' });

		expect(response.headers.get('RateLimit-Remaining')).toBe('1');
	});
});
