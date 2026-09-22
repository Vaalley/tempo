import { describe, expect, it } from 'vitest';
import { createAuthStore } from './auth.svelte';
import { createApiClient } from './client';

class MemoryStorage implements Storage {
	readonly #values = new Map<string, string>();

	get length(): number {
		return this.#values.size;
	}

	clear(): void {
		this.#values.clear();
	}

	getItem(key: string): string | null {
		return this.#values.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.#values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.#values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.#values.set(key, value);
	}
}

describe('authentication store', () => {
	it('logs in without persisting credentials and removes legacy storage', async () => {
		const storage = new MemoryStorage();
		storage.setItem('token', 'legacy-token');
		storage.setItem('user', '{}');
		let requestBody: unknown;
		const client = createApiClient('http://tempo.test', {
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				requestBody = await request.json();
				return Response.json({
					user: { id: 'user-1', email: 'user@tempo.test', role: 'USER' },
				});
			},
		});
		const store = createAuthStore({
			getClient: () => client,
			getStorage: () => storage,
		});

		await store.login('user@tempo.test', 'password123');

		expect(requestBody).toEqual({ email: 'user@tempo.test', password: 'password123' });
		expect(store.isLoggedIn).toBe(true);
		expect(store.user?.role).toBe('USER');
		expect(storage.getItem('token')).toBeNull();
		expect(storage.getItem('user')).toBeNull();
	});

	it('surfaces the API message when login fails', async () => {
		const storage = new MemoryStorage();
		const client = createApiClient('http://tempo.test', {
			fetch: async () =>
				Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 }),
		});
		const store = createAuthStore({
			getClient: () => client,
			getStorage: () => storage,
		});

		await expect(store.login('user@tempo.test', 'wrong-password')).rejects.toEqual(
			expect.objectContaining({
				message: 'Email ou mot de passe incorrect',
				status: 401,
			}),
		);
		expect(store.isLoggedIn).toBe(false);
		expect(storage.getItem('token')).toBeNull();
	});
});

describe('cookie session lifecycle', () => {
	const user = { id: 'user-1', email: 'user@tempo.test', role: 'USER' };
	it('restores once and logs out through the API', async () => {
		const paths: string[] = [];
		const client = createApiClient('http://tempo.test', {
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				paths.push(request.method + ' ' + new URL(request.url).pathname);
				return Response.json(request.method === 'GET' ? { user } : { message: 'OK' });
			},
		});
		const store = createAuthStore({ getClient: () => client });
		await Promise.all([store.restore(), store.restore()]);
		expect(store.user).toEqual(user);
		await store.logout();
		expect(store.isLoggedIn).toBe(false);
		expect(paths).toEqual(['GET /auth/session', 'POST /auth/logout']);
	});
	it('keeps the user when logout fails and retries restoration after a network failure', async () => {
		let fail = true;
		const client = createApiClient('http://tempo.test', {
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				if (fail || new Request(input, init).method === 'POST') throw new Error('offline');
				return Response.json({ user });
			},
		});
		const store = createAuthStore({ getClient: () => client });
		await expect(store.restore()).rejects.toThrow('offline');
		fail = false;
		await store.restore();
		await expect(store.logout()).rejects.toThrow('offline');
		expect(store.user).toEqual(user);
	});
	it('does not revive a cleared session when a pending restoration completes', async () => {
		let respond: ((response: Response) => void) | undefined;
		const client = createApiClient('http://tempo.test', {
			fetch: () =>
				new Promise<Response>((resolve) => {
					respond = resolve;
				}),
		});
		const store = createAuthStore({ getClient: () => client });
		const pending = store.restore();
		store.clear();
		respond?.(Response.json({ user }));
		await pending;
		expect(store.isLoggedIn).toBe(false);
	});
	it('treats an expired or absent cookie as a logged-out session', async () => {
		const client = createApiClient('http://tempo.test', {
			fetch: async () => Response.json({ user: null }),
		});
		const store = createAuthStore({ getClient: () => client });
		await store.restore();
		expect(store.user).toBeNull();
	});
});
