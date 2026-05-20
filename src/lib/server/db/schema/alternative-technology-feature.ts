import { pgTable, uuid, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { alternativesTable } from './alternative';
import { technologyFeaturesTable } from './technology-feature';

export const alternativeTechnologyFeaturesTable = pgTable(
	'alternative_technology_features',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternativesTable.id, { onDelete: 'cascade' }),
		technologyFeatureId: uuid('technology_feature_id')
			.notNull()
			.references(() => technologyFeaturesTable.id, { onDelete: 'cascade' }),
		isAvailable: boolean('is_available').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		unique('alternative_technology_features_alternative_technology_unique').on(
			table.alternativeId,
			table.technologyFeatureId
		)
	]
);
