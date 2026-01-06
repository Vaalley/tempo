import client from './client';

// Store réactif pour l'état d'authentification (Svelte 5 Runes)
let token = $state<string | null>(null);
let user = $state<{ id: string; email: string; role: string } | null>(null);

// Initialiser depuis localStorage au chargement
if (typeof window !== 'undefined') {
	token = localStorage.getItem('token');
	const savedUser = localStorage.getItem('user');
	if (savedUser) {
		user = JSON.parse(savedUser);
	}
}

export const auth = {
	get token() {
		return token;
	},
	get user() {
		return user;
	},
	get isLoggedIn() {
		return !!token;
	},

	async login(email: string, password: string) {
		const res = await (client as any).auth.login.$post({
			json: { email, password },
		});

		if (!res.ok) {
			const error = await res.json();
			throw new Error((error as { error: string }).error || 'Erreur de connexion');
		}

		const data = await res.json();
		token = data.token;
		user = data.user;

		localStorage.setItem('token', data.token);
		localStorage.setItem('user', JSON.stringify(data.user));

		return data;
	},

	async register(email: string, password: string) {
		const res = await (client as any).auth.register.$post({
			json: { email, password },
		});

		if (!res.ok) {
			const error = await res.json();
			throw new Error((error as { error: string }).error || "Erreur d'inscription");
		}

		return await res.json();
	},

	logout() {
		token = null;
		user = null;
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	},
};
