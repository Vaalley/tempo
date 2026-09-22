import type { AuthUser, LoginResponse, RegisteredUser } from './api-types';
import { readApiJson } from './api-response';
import { getPublicClient } from './client';

interface AuthStoreOptions {
	getClient?: typeof getPublicClient;
	getStorage?: () => Storage | null;
}

export function createAuthStore(options: AuthStoreOptions = {}) {
	const getClient = options.getClient ?? getPublicClient;
	let user = $state<AuthUser | null>(null);
	let initialization: Promise<void> | null = null;
	let revision = 0;

	function removeLegacySession(): void {
		try {
			const storage = options.getStorage
				? options.getStorage()
				: typeof window === 'undefined'
					? null
					: localStorage;
			storage?.removeItem('token');
			storage?.removeItem('user');
		} catch {
			// Cookie authentication also works when browser storage is disabled.
		}
	}

	function clear(): void {
		revision += 1;
		user = null;
		initialization = null;
		removeLegacySession();
	}

	return {
		get user() {
			return user;
		},
		get isLoggedIn() {
			return user !== null;
		},
		clear,

		async restore(): Promise<void> {
			removeLegacySession();
			if (!initialization) {
				const currentRevision = revision;
				initialization = (async () => {
					const response = await getClient().auth.session.$get();
					const data = await readApiJson<{ user: AuthUser | null }>(
						response,
						'Impossible de vérifier la session',
					);
					if (revision === currentRevision) user = data.user;
				})();
			}
			const pending = initialization;
			try {
				await pending;
			} catch (error) {
				if (initialization === pending) initialization = null;
				throw error;
			}
		},

		async login(email: string, password: string): Promise<LoginResponse> {
			const response = await getClient().auth.login.$post({ json: { email, password } });
			const data = await readApiJson<LoginResponse>(response, 'Erreur de connexion');
			revision += 1;
			user = data.user;
			initialization = Promise.resolve();
			removeLegacySession();
			return data;
		},

		async register(email: string, password: string): Promise<RegisteredUser> {
			const response = await getClient().auth.register.$post({ json: { email, password } });
			return await readApiJson<RegisteredUser>(response, "Erreur d'inscription");
		},

		async logout(): Promise<void> {
			const response = await getClient().auth.logout.$post();
			await readApiJson(response, 'La déconnexion a échoué. Réessayez.');
			clear();
		},
	};
}

export type AuthStore = ReturnType<typeof createAuthStore>;
export const auth = createAuthStore();
