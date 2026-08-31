import { describe, expect, it } from 'bun:test';
import { getDemoSeedConfig } from './demo-seed.config';

const validEnvironment = {
	DEMO_ADMIN_EMAIL: 'admin@tempo.test',
	DEMO_ADMIN_PASSWORD: 'admin-password',
	DEMO_USER_EMAIL: 'user@tempo.test',
	DEMO_USER_PASSWORD: 'user-password',
};

describe('demo seed configuration', () => {
	it('loads explicit demo account credentials', () => {
		expect(getDemoSeedConfig(validEnvironment)).toEqual({
			admin: { email: 'admin@tempo.test', password: 'admin-password' },
			user: { email: 'user@tempo.test', password: 'user-password' },
		});
	});

	it('rejects missing credentials', () => {
		expect(() => getDemoSeedConfig({})).toThrow('Invalid demo seed configuration');
	});

	it('rejects passwords shorter than eight characters', () => {
		expect(() =>
			getDemoSeedConfig({ ...validEnvironment, DEMO_USER_PASSWORD: 'short' }),
		).toThrow('DEMO_USER_PASSWORD');
	});
});
