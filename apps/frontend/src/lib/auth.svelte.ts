import type { AuthUser, LoginResponse, RegisteredUser } from './api-types';
import { readApiJson } from './api-response';
import { getPublicClient } from './client';

interface AuthStoreOptions {
	getClient?: typeof getPublicClient;
	getStorage?: () => Storage | null;
}

function browserStorage(): Storage | null {
	return typeof window === 'undefined' ? null : localStorage;
}

function storedUser(storage: Storage | null): AuthUser | null {
	const value = storage?.getItem('user');

	if (!value) return null;

	try {
		return JSON.parse(value) as AuthUser;
	} catch {
		storage?.removeItem('user');
		storage?.removeItem('token');
		return null;
	}
}

export function createAuthStore(options: AuthStoreOptions = {}) {
	const getClient = options.getClient ?? getPublicClient;
	const storage = (options.getStorage ?? browserStorage)();

	let token = $state<string | null>(storage?.getItem('token') ?? null);
	let user = $state<AuthUser | null>(storedUser(storage));

	return {
		get token() {
			return token;
		},
		get user() {
			return user;
		},
		get isLoggedIn() {
			return Boolean(token && user);
		},

		async login(email: string, password: string): Promise<LoginResponse> {
			const response = await getClient().auth.login.$post({
				json: { email, password },
			});
			const data = await readApiJson<LoginResponse>(response, 'Erreur de connexion');

			token = data.token;
			user = data.user;
			storage?.setItem('token', data.token);
			storage?.setItem('user', JSON.stringify(data.user));

			return data;
		},

		async register(email: string, password: string): Promise<RegisteredUser> {
			const response = await getClient().auth.register.$post({
				json: { email, password },
			});

			return await readApiJson<RegisteredUser>(response, "Erreur d'inscription");
		},

		logout(): void {
			token = null;
			user = null;
			storage?.removeItem('token');
			storage?.removeItem('user');
		},
	};
}

export type AuthStore = ReturnType<typeof createAuthStore>;
export const auth = createAuthStore();
