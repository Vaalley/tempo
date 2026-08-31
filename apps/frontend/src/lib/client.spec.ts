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

	it('adds the bearer token to authenticated requests', async () => {
		let authorizationHeader: string | null = null;
		const client = createApiClient('http://tempo.test', {
			token: 'test-token',
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				authorizationHeader = request.headers.get('authorization');
				return Response.json([]);
			},
		});

		await client.bookings.$get();

		expect(authorizationHeader).toBe('Bearer test-token');
	});
});
