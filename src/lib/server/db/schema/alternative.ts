import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const alternativesTable = pgTable('alternatives', {
	id: uuid('id').defaultRandom().primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	category: text('category'),
	imgUrl: text('img_url'),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
