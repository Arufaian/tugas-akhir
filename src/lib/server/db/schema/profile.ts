import { pgTable, pgEnum, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { authUsers } from './auth';

export const profileRoleEnum = pgEnum('profile_role', ['sales', 'admin']);

export const profilesTable = pgTable('profiles', {
	id: uuid('id')
		.primaryKey()
		.references(() => authUsers.id, { onDelete: 'cascade' }),

	name: text('name').notNull(),
	role: profileRoleEnum().default('sales').notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
