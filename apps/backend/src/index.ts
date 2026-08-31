import { createApp } from './app';
import { getHttpSecurityConfig } from './config/security.config';
import { migrateDatabase } from './db/migrate';
import { connectMongo } from './db/mongo';

await migrateDatabase();
console.log('✅ PostgreSQL migrations applied');

const app = createApp(getHttpSecurityConfig());

connectMongo().catch(console.error);

export default {
	port: 3000,
	fetch: app.fetch,
};

// On exporte le type de l'API pour le frontend
export type AppType = ReturnType<typeof createApp>;
