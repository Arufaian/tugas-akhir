import { pgTable, uuid, numeric, timestamp, unique } from 'drizzle-orm/pg-core';
import { alternativesTable } from './alternative';
import { calculationRunsTable } from './calculation-run';
import { criteriaTable, criterionTypeEnum } from './criterion';

export const calculationDetailsTable = pgTable(
	'calculation_details',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		calculationRunId: uuid('calculation_run_id')
			.notNull()
			.references(() => calculationRunsTable.id, { onDelete: 'cascade' }),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternativesTable.id, { onDelete: 'cascade' }),
		criterionId: uuid('criterion_id')
			.notNull()
			.references(() => criteriaTable.id, { onDelete: 'cascade' }),
		rawValue: numeric('raw_value', { precision: 14, scale: 4 }).notNull(),
		denominator: numeric('denominator', { precision: 18, scale: 9 }).notNull(),
		normalizedValue: numeric('normalized_value', { precision: 18, scale: 9 }).notNull(),
		weight: numeric('weight', { precision: 12, scale: 9 }).notNull(),
		weightedValue: numeric('weighted_value', { precision: 18, scale: 9 }).notNull(),
		criterionType: criterionTypeEnum().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		unique('calculation_details_run_alternative_criterion_unique').on(
			table.calculationRunId,
			table.alternativeId,
			table.criterionId
		)
	]
);
