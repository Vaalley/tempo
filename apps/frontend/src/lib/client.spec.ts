import { describe, expect, it } from 'vitest';
import { createApiClient, normalizeApiUrl } from './client';

describe('API client', () => {
	it('normalizes the configured public API URL', () => {
		expect(normalizeApiUrl(' https://tempo.example/api ')).toBe('https://tempo.example/api/');
	});

	it.each([undefined, '', 'tempo.example', 'ftp://tempo.example'])(
		'rejects an invalid public API URL: %s',
		(value) => {
			expect(() => normalizeApiUrl(value)).toThrow('PUBLIC_API_URL');
		},
	);

	it('sends cookies and CSRF protection without a bearer token', async () => {
		let captured: Request | undefined;
		const client = createApiClient('http://tempo.test', {
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				captured = request;
				return Response.json([]);
			},
		});

		await client.bookings.$get();

		expect(captured?.credentials).toBe('include');
		expect(captured?.headers.get('X-CSRF-Protection')).toBe('1');
		expect(captured?.headers.has('Authorization')).toBe(false);
	});
});
