import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { authUsers } from './auth';

export const profileRoleEnum = pgEnum('profile_role', ['sales', 'admin']);

export const profilesTable = pgTable('profiles', {
	id: uuid('id')
		.primaryKey()
		.references(() => authUsers.id, { onDelete: 'cascade' }),

	name: text('name').notNull(),
	role: profileRoleEnum().default('sales').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
