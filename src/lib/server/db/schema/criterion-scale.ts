import { pgTable, uuid, text, numeric, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { criteriaTable } from './criterion';

export const criterionScalesTable = pgTable('criterion_scales', {
	id: uuid('id').defaultRandom().primaryKey(),
	criterionId: uuid('criterion_id')
		.notNull()
		.references(() => criteriaTable.id, { onDelete: 'cascade' }),
	label: text('label').notNull(),
	value: numeric('value', { precision: 10, scale: 4 }).notNull(),
	description: text('description'),
	orderIndex: integer('order_index').notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	unique('uq_criterion_scale_value').on(table.criterionId, table.value)
]);
