import { sql } from 'drizzle-orm';
import { pgTable, uuid, numeric, text, timestamp, unique, check } from 'drizzle-orm/pg-core';
import { alternativesTable } from './alternative';
import { criteriaTable } from './criterion';

export const alternativeCriterionValuesTable = pgTable(
	'alternative_criterion_values',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternativesTable.id, { onDelete: 'cascade' }),
		criterionId: uuid('criterion_id')
			.notNull()
			.references(() => criteriaTable.id, { onDelete: 'cascade' }),
		rawValue: numeric('raw_value', { precision: 14, scale: 4 }).notNull(),
		labelValue: text('label_value'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		unique('alternative_criterion_values_alternative_criterion_unique').on(
			table.alternativeId,
			table.criterionId
		),
		check('alternative_criterion_values_raw_value_non_negative', sql`${table.rawValue} >= 0`)
	]
);
