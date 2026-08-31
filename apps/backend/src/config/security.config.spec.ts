import { describe, expect, it } from 'bun:test';
import { getHttpSecurityConfig } from './security.config';

describe('HTTP security configuration', () => {
	it('loads an explicit frontend origin and safe rate-limit defaults', () => {
		const config = getHttpSecurityConfig({
			FRONTEND_ORIGIN: 'https://tempo.example.com',
		});

		expect(config).toEqual({
			frontendOrigin: 'https://tempo.example.com',
			authRateLimit: {
				limit: 10,
				windowMs: 900_000,
			},
			trustProxy: false,
		});
	});

	it('loads explicit rate-limit and proxy settings', () => {
		const config = getHttpSecurityConfig({
			FRONTEND_ORIGIN: 'http://localhost:5173/',
			AUTH_RATE_LIMIT_MAX: '5',
			AUTH_RATE_LIMIT_WINDOW_MS: '60000',
			TRUST_PROXY: 'true',
		});

		expect(config).toEqual({
			frontendOrigin: 'http://localhost:5173',
			authRateLimit: {
				limit: 5,
				windowMs: 60_000,
			},
			trustProxy: true,
		});
	});

	it('rejects a missing frontend origin', () => {
		expect(() => getHttpSecurityConfig({})).toThrow(
			'FRONTEND_ORIGIN is required but is not configured',
		);
	});

	it('rejects a frontend URL containing a path', () => {
		expect(() =>
			getHttpSecurityConfig({ FRONTEND_ORIGIN: 'https://tempo.example.com/app' }),
		).toThrow('FRONTEND_ORIGIN must be a valid HTTP(S) origin');
	});

	it('rejects invalid rate-limit and proxy settings', () => {
		expect(() =>
			getHttpSecurityConfig({
				FRONTEND_ORIGIN: 'https://tempo.example.com',
				AUTH_RATE_LIMIT_MAX: '0',
			}),
		).toThrow('AUTH_RATE_LIMIT_MAX must be a positive integer');

		expect(() =>
			getHttpSecurityConfig({
				FRONTEND_ORIGIN: 'https://tempo.example.com',
				TRUST_PROXY: 'yes',
			}),
		).toThrow('TRUST_PROXY must be either true or false');
	});
});
