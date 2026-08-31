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
	it('logs in and persists the authenticated session', async () => {
		const storage = new MemoryStorage();
		let requestBody: unknown;
		const client = createApiClient('http://tempo.test', {
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				requestBody = await request.json();
				return Response.json({
					token: 'signed-token',
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
		expect(storage.getItem('token')).toBe('signed-token');
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
