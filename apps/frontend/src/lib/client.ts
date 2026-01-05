import { hc } from 'hono/client';
// Import du type directement depuis le code source du backend
import type { AppType } from '@tempo/backend/src/index';

// On se connecte au port 3000 (Backend)
const client = hc<AppType>('http://localhost:3000/');

export default client;
