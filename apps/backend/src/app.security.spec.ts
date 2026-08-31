import { describe, expect, it } from 'bun:test';

process.env.JWT_SECRET = 'test-jwt-secret';

const { createApp } = await import('./app');

function buildApp(limit = 10) {
	return createApp({
		frontendOrigin: 'https://tempo.example.com',
		authRateLimit: {
			limit,
			windowMs: 60_000,
		},
		trustProxy: true,
		logger: false,
	});
}

describe('HTTP security middleware', () => {
	it('allows only the configured frontend origin through CORS', async () => {
		const app = buildApp();
		const allowedResponse = await app.request('/health', {
			headers: { Origin: 'https://tempo.example.com' },
		});
		const rejectedResponse = await app.request('/health', {
			headers: { Origin: 'https://malicious.example.com' },
		});

		expect(allowedResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'https://tempo.example.com',
		);
		expect(rejectedResponse.headers.has('Access-Control-Allow-Origin')).toBe(false);
	});

	it('adds restrictive security headers', async () => {
		const response = await buildApp().request('/health');

		expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
		expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
		expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
	});

	it('limits authentication requests before reaching the database', async () => {
		const app = buildApp(2);
		const request = () =>
			app.request('/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-forwarded-for': '192.0.2.10',
				},
				body: JSON.stringify({}),
			});

		expect((await request()).status).toBe(400);
		expect((await request()).status).toBe(400);

		const blockedResponse = await request();

		expect(blockedResponse.status).toBe(429);
		expect(blockedResponse.headers.get('Retry-After')).not.toBeNull();
		expect(blockedResponse.headers.get('Cache-Control')).toBe('no-store');
	});
});
