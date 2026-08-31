import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closePostgres, db } from '.';

export const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export async function migrateDatabase(): Promise<void> {
	await migrate(db, { migrationsFolder });
}

if (import.meta.main) {
	try {
		await migrateDatabase();
		console.log('✅ PostgreSQL migrations applied');
	} finally {
		await closePostgres();
	}
}
