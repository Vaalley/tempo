import { eq } from 'drizzle-orm';
import { getDemoSeedConfig } from '../config/demo-seed.config';
import { closePostgres, db } from '.';
import { users, workspaces } from './schema';
import { migrateDatabase } from './migrate';

const demoWorkspaces = [
	{ name: 'Bureau Horizon', type: 'DESK' as const, capacity: 1 },
	{ name: 'Bureau Rivage', type: 'DESK' as const, capacity: 1 },
	{ name: 'Salle Atlas', type: 'MEETING_ROOM' as const, capacity: 6 },
	{ name: 'Salle Boréale', type: 'MEETING_ROOM' as const, capacity: 10 },
];

async function upsertDemoUser(
	email: string,
	password: string,
	role: 'ADMIN' | 'USER',
): Promise<void> {
	const hashedPassword = await Bun.password.hash(password);

	await db
		.insert(users)
		.values({ email, password: hashedPassword, role })
		.onConflictDoUpdate({
			target: users.email,
			set: { password: hashedPassword, role },
		});
}

async function upsertDemoWorkspace(workspace: (typeof demoWorkspaces)[number]): Promise<void> {
	const existing = await db.query.workspaces.findFirst({
		where: eq(workspaces.name, workspace.name),
	});

	if (existing) {
		await db.update(workspaces).set(workspace).where(eq(workspaces.id, existing.id));
		return;
	}

	await db.insert(workspaces).values(workspace);
}

export async function seedDemoData(): Promise<void> {
	const config = getDemoSeedConfig();

	await migrateDatabase();
	await Promise.all([
		upsertDemoUser(config.admin.email, config.admin.password, 'ADMIN'),
		upsertDemoUser(config.user.email, config.user.password, 'USER'),
	]);

	for (const workspace of demoWorkspaces) {
		await upsertDemoWorkspace(workspace);
	}

	console.log(`✅ Demo data ready for ${config.admin.email} and ${config.user.email}`);
}

if (import.meta.main) {
	try {
		await seedDemoData();
	} finally {
		await closePostgres();
	}
}
