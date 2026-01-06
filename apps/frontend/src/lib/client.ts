import { hc } from 'hono/client';
// Import du type directement depuis le code source du backend
import type { AppType } from '@tempo/backend/src/index';

const API_URL = 'http://localhost:3000/';

// Client sans authentification (pour login/register)
const client = hc<AppType>(API_URL);

// Client avec token JWT (pour les routes protégées)
export function getAuthClient() {
	const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
	return hc<AppType>(API_URL, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

export default client;
