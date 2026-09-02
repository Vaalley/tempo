import { and, eq } from 'drizzle-orm';
import { getDemoSeedConfig } from '../config/demo-seed.config';
import { closePostgres, db } from '.';
import { bookingParticipants, bookings, users, workspaces } from './schema';
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
): Promise<{ id: string; email: string }> {
	const hashedPassword = await Bun.password.hash(password);

	const [user] = await db
		.insert(users)
		.values({ email, password: hashedPassword, role })
		.onConflictDoUpdate({
			target: users.email,
			set: { password: hashedPassword, role },
		})
		.returning({ id: users.id, email: users.email });

	return user;
}

async function upsertDemoWorkspace(
	workspace: (typeof demoWorkspaces)[number],
): Promise<{ id: number; name: string }> {
	const existing = await db.query.workspaces.findFirst({
		where: eq(workspaces.name, workspace.name),
	});

	if (existing) {
		const [updated] = await db
			.update(workspaces)
			.set(workspace)
			.where(eq(workspaces.id, existing.id))
			.returning({ id: workspaces.id, name: workspaces.name });
		return updated;
	}

	const [created] = await db
		.insert(workspaces)
		.values(workspace)
		.returning({ id: workspaces.id, name: workspaces.name });
	return created;
}

async function upsertDemoBooking(
	ownerId: string,
	guestId: string,
	workspaceId: number,
): Promise<void> {
	const startAt = new Date('2027-12-15T13:00:00.000Z');
	const endAt = new Date('2027-12-15T15:00:00.000Z');
	let booking = await db.query.bookings.findFirst({
		where: and(
			eq(bookings.userId, ownerId),
			eq(bookings.workspaceId, workspaceId),
			eq(bookings.startAt, startAt),
			eq(bookings.endAt, endAt),
		),
	});

	if (!booking) {
		[booking] = await db
			.insert(bookings)
			.values({ userId: ownerId, workspaceId, startAt, endAt, visibility: 'PUBLIC' })
			.returning();
	} else if (booking.visibility !== 'PUBLIC') {
		[booking] = await db
			.update(bookings)
			.set({ visibility: 'PUBLIC' })
			.where(eq(bookings.id, booking.id))
			.returning();
	}

	await db
		.insert(bookingParticipants)
		.values([
			{
				bookingId: booking.id,
				userId: ownerId,
				role: 'OWNER',
				invitationStatus: 'ACCEPTED',
				respondedAt: booking.createdAt ?? new Date(),
			},
			{
				bookingId: booking.id,
				userId: guestId,
				role: 'GUEST',
				invitationStatus: 'PENDING',
			},
		])
		.onConflictDoNothing();
}

export async function seedDemoData(): Promise<void> {
	const config = getDemoSeedConfig();

	await migrateDatabase();
	const [admin, user] = await Promise.all([
		upsertDemoUser(config.admin.email, config.admin.password, 'ADMIN'),
		upsertDemoUser(config.user.email, config.user.password, 'USER'),
	]);

	let meetingRoomId = 0;
	for (const workspace of demoWorkspaces) {
		const savedWorkspace = await upsertDemoWorkspace(workspace);
		if (savedWorkspace.name === 'Salle Atlas') meetingRoomId = savedWorkspace.id;
	}

	await upsertDemoBooking(admin.id, user.id, meetingRoomId);

	console.log(`✅ Demo data ready for ${config.admin.email} and ${config.user.email}`);
}

if (import.meta.main) {
	try {
		await seedDemoData();
	} finally {
		await closePostgres();
	}
}
