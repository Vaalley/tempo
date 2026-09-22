import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { AuthEnv, JWTPayload } from '../../middlewares/auth.guard';
import { authService } from './auth.service';

export const sessionCookieName = 'tempo_session';
export const sessionLifetimeSeconds = 24 * 60 * 60;

function cookieOptions(c: Context<AuthEnv>) {
	return {
		httpOnly: true,
		secure: c.get('sessionCookieSecure') ?? new URL(c.req.url).protocol === 'https:',
		sameSite: 'Strict' as const,
		path: '/',
	};
}

export function setSessionCookie(c: Context<AuthEnv>, token: string): void {
	setCookie(c, sessionCookieName, token, { ...cookieOptions(c), maxAge: sessionLifetimeSeconds });
}

export function clearSessionCookie(c: Context<AuthEnv>): void {
	deleteCookie(c, sessionCookieName, cookieOptions(c));
}

export async function readSession(c: Context<AuthEnv>): Promise<JWTPayload | null> {
	const token = getCookie(c, sessionCookieName);
	if (!token) return null;
	try {
		const payload = await verify(token, authService.getSecret(), 'HS256');
		if (
			typeof payload.sub !== 'string' ||
			typeof payload.email !== 'string' ||
			(payload.role !== 'USER' && payload.role !== 'ADMIN') ||
			typeof payload.exp !== 'number'
		)
			return null;
		return { sub: payload.sub, email: payload.email, role: payload.role, exp: payload.exp };
	} catch {
		return null;
	}
}
