import { createApp } from './app';
import { getHttpSecurityConfig } from './config/security.config';
import { connectMongo } from './db/mongo';

const app = createApp(getHttpSecurityConfig());

connectMongo().catch(console.error);

export default {
	port: 3000,
	fetch: app.fetch,
};

// On exporte le type de l'API pour le frontend
export type AppType = ReturnType<typeof createApp>;
