import { sql } from 'drizzle-orm';
import {
	pgTable,
	uuid,
	text,
	numeric,
	integer,
	timestamp,
	unique,
	check
} from 'drizzle-orm/pg-core';
import { alternativesTable } from './alternative';
import { calculationRunsTable } from './calculation-run';

export const calculationResultsTable = pgTable(
	'calculation_results',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		calculationRunId: uuid('calculation_run_id')
			.notNull()
			.references(() => calculationRunsTable.id, { onDelete: 'cascade' }),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternativesTable.id, { onDelete: 'restrict' }),
		alternativeCode: text('alternative_code').notNull(),
		alternativeName: text('alternative_name').notNull(),
		totalBenefit: numeric('total_benefit', { precision: 18, scale: 9 }).notNull(),
		totalCost: numeric('total_cost', { precision: 18, scale: 9 }).notNull(),
		optimizationScore: numeric('optimization_score', { precision: 18, scale: 9 }).notNull(),
		rank: integer('rank').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		unique('calculation_results_run_alternative_unique').on(
			table.calculationRunId,
			table.alternativeId
		),
		unique('calculation_results_run_rank_unique').on(table.calculationRunId, table.rank),
		check('calculation_results_rank_positive', sql`${table.rank} > 0`)
	]
);
