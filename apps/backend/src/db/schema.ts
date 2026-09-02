import {
	check,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const workspaceTypeEnum = pgEnum('workspace_type', ['DESK', 'MEETING_ROOM']);
export const bookingVisibilityEnum = pgEnum('booking_visibility', ['PUBLIC', 'PRIVATE']);
export const participantRoleEnum = pgEnum('participant_role', ['OWNER', 'GUEST']);
export const invitationStatusEnum = pgEnum('invitation_status', [
	'PENDING',
	'ACCEPTED',
	'DECLINED',
]);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').unique().notNull(),
	password: text('password').notNull(),
	role: roleEnum('role').default('USER').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

export const workspaces = pgTable(
	'workspaces',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull(),
		type: workspaceTypeEnum('type').notNull(),
		capacity: integer('capacity').notNull().default(1),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [check('workspaces_capacity_check', sql`${table.capacity} >= 1`)],
);

export const bookings = pgTable(
	'bookings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		workspaceId: integer('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		startAt: timestamp('start_at').notNull(),
		endAt: timestamp('end_at').notNull(),
		visibility: bookingVisibilityEnum('visibility').default('PRIVATE').notNull(),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		index('bookings_user_id_idx').on(table.userId),
		index('bookings_workspace_time_idx').on(table.workspaceId, table.startAt, table.endAt),
	],
);

export const bookingParticipants = pgTable(
	'booking_participants',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		bookingId: uuid('booking_id')
			.notNull()
			.references(() => bookings.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: participantRoleEnum('role').default('GUEST').notNull(),
		invitationStatus: invitationStatusEnum('invitation_status').default('PENDING').notNull(),
		invitedAt: timestamp('invited_at').defaultNow().notNull(),
		respondedAt: timestamp('responded_at'),
		checkedInAt: timestamp('checked_in_at'),
	},
	(table) => [
		uniqueIndex('booking_participants_booking_user_unique').on(table.bookingId, table.userId),
		index('booking_participants_user_status_idx').on(table.userId, table.invitationStatus),
		index('booking_participants_booking_status_idx').on(
			table.bookingId,
			table.invitationStatus,
		),
	],
);

export const bookingQrTokens = pgTable('booking_qr_tokens', {
	bookingId: uuid('booking_id')
		.primaryKey()
		.references(() => bookings.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	expiresAt: timestamp('expires_at').notNull(),
});

// Relations pour les requêtes avec jointures
export const usersRelations = relations(users, ({ many }) => ({
	bookings: many(bookings),
	bookingParticipants: many(bookingParticipants),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ many, one }) => ({
	user: one(users, {
		fields: [bookings.userId],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [bookings.workspaceId],
		references: [workspaces.id],
	}),
	participants: many(bookingParticipants),
	qrToken: one(bookingQrTokens),
}));

export const bookingParticipantsRelations = relations(bookingParticipants, ({ one }) => ({
	booking: one(bookings, {
		fields: [bookingParticipants.bookingId],
		references: [bookings.id],
	}),
	user: one(users, {
		fields: [bookingParticipants.userId],
		references: [users.id],
	}),
}));

export const bookingQrTokensRelations = relations(bookingQrTokens, ({ one }) => ({
	booking: one(bookings, {
		fields: [bookingQrTokens.bookingId],
		references: [bookings.id],
	}),
}));
