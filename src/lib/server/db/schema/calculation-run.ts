import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, timestamp, check } from 'drizzle-orm/pg-core';
import { profilesTable } from './profile';

export const calculationRunsTable = pgTable(
	'calculation_runs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		runName: text('run_name'),
		createdBy: uuid('created_by').references(() => profilesTable.id, { onDelete: 'set null' }),
		criteriaCount: integer('criteria_count').notNull(),
		alternativeCount: integer('alternative_count').notNull(),
		note: text('note'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		check('calculation_runs_criteria_count_positive', sql`${table.criteriaCount} > 0`),
		check('calculation_runs_alternative_count_positive', sql`${table.alternativeCount} > 0`)
	]
);
