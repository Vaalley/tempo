import { pgTable, uuid, text, timestamp, pgEnum, serial, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const workspaceTypeEnum = pgEnum('workspace_type', ['DESK', 'MEETING_ROOM']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').unique().notNull(),
	password: text('password').notNull(),
	role: roleEnum('role').default('USER'),
	createdAt: timestamp('created_at').defaultNow(),
});

export const workspaces = pgTable('workspaces', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	type: workspaceTypeEnum('type').notNull(),
	capacity: integer('capacity').notNull().default(1),
	createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	workspaceId: integer('workspace_id')
		.notNull()
		.references(() => workspaces.id, { onDelete: 'cascade' }),
	startAt: timestamp('start_at').notNull(),
	endAt: timestamp('end_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

// Relations pour les requêtes avec jointures
export const usersRelations = relations(users, ({ many }) => ({
	bookings: many(bookings),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	user: one(users, {
		fields: [bookings.userId],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [bookings.workspaceId],
		references: [workspaces.id],
	}),
}));
