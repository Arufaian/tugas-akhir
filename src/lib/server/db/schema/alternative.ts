import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const alternativesTable = pgTable('alternatives', {
	id: uuid('id').defaultRandom().primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	category: text('category'),
	img: jsonb('img'),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export type AlternativeImage = {
	url: string;
	path: string | null;
	originalName?: string;
};
