import { pgTable, uuid, text, timestamp, pgEnum, serial, integer } from 'drizzle-orm/pg-core';

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
