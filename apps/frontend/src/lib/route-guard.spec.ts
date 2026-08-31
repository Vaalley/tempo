import { describe, expect, it } from 'vitest';
import type { AuthUser } from './api-types';
import { accessRedirect } from './route-guard';

const user: AuthUser = { id: 'user-1', email: 'user@tempo.test', role: 'USER' };
const admin: AuthUser = { id: 'admin-1', email: 'admin@tempo.test', role: 'ADMIN' };

describe('route access guards', () => {
	it('redirects anonymous visitors to login', () => {
		expect(accessRedirect({ isLoggedIn: false, user: null }, 'AUTHENTICATED')).toBe('/login');
	});

	it('allows authenticated users on protected pages', () => {
		expect(accessRedirect({ isLoggedIn: true, user }, 'AUTHENTICATED')).toBeNull();
	});

	it('redirects standard users away from administrator pages', () => {
		expect(accessRedirect({ isLoggedIn: true, user }, 'ADMIN')).toBe('/');
	});

	it('allows administrators on administrator pages', () => {
		expect(accessRedirect({ isLoggedIn: true, user: admin }, 'ADMIN')).toBeNull();
	});
});
