import {
	pgTable,
	pgEnum,
	uuid,
	text,
	numeric,
	integer,
	boolean,
	timestamp,
	uniqueIndex,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const criterionTypeEnum = pgEnum('criterion_type', ['benefit', 'cost']);
export const inputTypeEnum = pgEnum('input_type', ['number', 'scale', 'tech_features']);

export const criteriaTable = pgTable(
	'criteria',
	{
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
		isPrice: boolean('is_price').default(false).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('uq_criteria_single_tech_features')
			.on(table.inputType)
			.where(sql`${table.inputType} = 'tech_features'`),
		uniqueIndex('uq_criteria_single_price')
			.on(table.isPrice)
			.where(sql`${table.isPrice} = true`),
		check(
			'criteria_price_invariants',
			sql`NOT ${table.isPrice} OR (${table.isActive} AND ${table.type} = 'cost' AND ${table.inputType} = 'number' AND ${table.unit} = 'Rp')`
		)
	]
);
