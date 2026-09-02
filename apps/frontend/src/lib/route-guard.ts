import { goto } from '$app/navigation';
import type { AuthUser } from './api-types';
import { auth } from './auth.svelte';

export type RouteAccess = 'AUTHENTICATED' | 'ADMIN';

export interface SessionSnapshot {
	isLoggedIn: boolean;
	user: AuthUser | null;
}

export function safeReturnTo(value: string | null): string {
	if (!value?.startsWith('/')) return '/';

	try {
		const applicationOrigin = 'http://tempo.local';
		const destination = new URL(value, applicationOrigin);

		if (destination.origin !== applicationOrigin) return '/';
		return `${destination.pathname}${destination.search}${destination.hash}`;
	} catch {
		return '/';
	}
}

export function accessRedirect(
	session: SessionSnapshot,
	requiredAccess: RouteAccess,
): '/login' | '/' | null {
	if (!session.isLoggedIn) return '/login';
	if (requiredAccess === 'ADMIN' && session.user?.role !== 'ADMIN') return '/';
	return null;
}

export async function enforceRouteAccess(requiredAccess: RouteAccess): Promise<boolean> {
	const redirect = accessRedirect(auth, requiredAccess);

	if (!redirect) return true;

	await goto(redirect, { replaceState: true });
	return false;
}

export async function logoutAndRedirect(): Promise<void> {
	auth.logout();
	await goto('/login', { replaceState: true });
}
