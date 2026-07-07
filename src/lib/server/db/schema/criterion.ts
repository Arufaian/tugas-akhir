import {
	pgTable,
	pgEnum,
	uuid,
	text,
	numeric,
	integer,
	boolean,
	timestamp
} from 'drizzle-orm/pg-core';

export const criterionTypeEnum = pgEnum('criterion_type', ['benefit', 'cost']);
export const inputTypeEnum = pgEnum('input_type', ['number', 'scale', 'tech_features']);

export const criteriaTable = pgTable('criteria', {
	id: uuid('id').defaultRandom().primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	unit: text('unit').notNull(),
	rawWeight: numeric('raw_weight', { precision: 10, scale: 4 }).notNull(),
	normalizedWeight: numeric('normalized_weight', { precision: 12, scale: 9 }).notNull(),
	type: criterionTypeEnum().notNull(),
	inputType: inputTypeEnum('input_type').default('number').notNull(),
	orderIndex: integer('order_index').notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
