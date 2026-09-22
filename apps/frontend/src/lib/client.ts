import { env } from '$env/dynamic/public';
import { hc } from 'hono/client';
import type { ClientRequestOptions } from 'hono/client';
import type { AppType } from '@tempo/backend/src/index';

export interface ApiClientOptions {
	fetch?: ClientRequestOptions['fetch'];
}

export function normalizeApiUrl(value: string | undefined): string {
	const apiUrl = value?.trim();

	if (!apiUrl) {
		throw new Error('PUBLIC_API_URL est obligatoire');
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(apiUrl);
	} catch {
		throw new Error('PUBLIC_API_URL doit être une URL HTTP(S) valide');
	}

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw new Error('PUBLIC_API_URL doit être une URL HTTP(S) valide');
	}

	return `${parsedUrl.origin}${parsedUrl.pathname.replace(/\/$/, '')}/`;
}

export function createApiClient(apiUrl: string | undefined, options: ApiClientOptions = {}) {
	return hc<AppType>(normalizeApiUrl(apiUrl), {
		init: { credentials: 'include' },
		headers: { 'X-CSRF-Protection': '1' },
		fetch: options.fetch,
	});
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function getPublicClient(): ApiClient {
	return createApiClient(env.PUBLIC_API_URL);
}

export function getAuthClient(): ApiClient {
	return createApiClient(env.PUBLIC_API_URL);
}
