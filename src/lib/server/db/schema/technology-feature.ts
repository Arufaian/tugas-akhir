import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const technologyFeaturesTable = pgTable('technology_features', {
	id: uuid('id').defaultRandom().primaryKey(),
	aspect: text('aspect').notNull(),
	name: text('name').notNull(),
	score: numeric('score', { precision: 8, scale: 2 }).notNull(),
	description: text('description'),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
