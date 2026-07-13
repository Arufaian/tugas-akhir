import { asc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	calculationDetailsTable,
	calculationResultsTable,
	calculationRunsTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema/index.js';
import { calculateMoora } from './moora.js';

export type CreateMooraCalculationResult =
	| { success: false; issues: string[] }
	| { success: true; runId: string };

export async function createMooraCalculation(
	createdBy: string
): Promise<CreateMooraCalculationResult> {
	return db.transaction(
		async (tx) => {
			const alternatives = await tx
				.select({
					id: alternativesTable.id,
					code: alternativesTable.code,
					name: alternativesTable.name
				})
				.from(alternativesTable)
				.where(eq(alternativesTable.isActive, true))
				.orderBy(asc(alternativesTable.code));
			const criteria = await tx
				.select({
					id: criteriaTable.id,
					code: criteriaTable.code,
					name: criteriaTable.name,
					unit: criteriaTable.unit,
					orderIndex: criteriaTable.orderIndex,
					type: criteriaTable.type,
					inputType: criteriaTable.inputType,
					normalizedWeight: criteriaTable.normalizedWeight
				})
				.from(criteriaTable)
				.where(eq(criteriaTable.isActive, true))
				.orderBy(asc(criteriaTable.orderIndex), asc(criteriaTable.code));
			const values = await tx
				.select({
					alternativeId: alternativeCriterionValuesTable.alternativeId,
					criterionId: alternativeCriterionValuesTable.criterionId,
					rawValue: alternativeCriterionValuesTable.rawValue,
					labelValue: alternativeCriterionValuesTable.labelValue
				})
				.from(alternativeCriterionValuesTable);
			const scales = await tx
				.select({
					criterionId: criterionScalesTable.criterionId,
					value: criterionScalesTable.value
				})
				.from(criterionScalesTable)
				.where(eq(criterionScalesTable.isActive, true));
			const calculation = calculateMoora({ alternatives, criteria, values, scales });

			if (!calculation.success) return calculation;

			const createdAt = new Date();
			const [run] = await tx
				.insert(calculationRunsTable)
				.values({
					runName: `Perhitungan ${createdAt.toISOString()}`,
					createdBy,
					criteriaCount: calculation.criteria.length,
					alternativeCount: calculation.alternatives.length,
					createdAt
				})
				.returning({ id: calculationRunsTable.id });

			if (!run) throw new Error('Calculation run insert returned no id');

			await tx.insert(calculationResultsTable).values(
				calculation.results.map((result) => ({
					calculationRunId: run.id,
					alternativeId: result.id,
					alternativeCode: result.code,
					alternativeName: result.name,
					totalBenefit: result.totalBenefit.toFixed(9),
					totalCost: result.totalCost.toFixed(9),
					optimizationScore: result.optimizationScore.toFixed(9),
					rank: result.rank
				}))
			);
			await tx.insert(calculationDetailsTable).values(
				calculation.details.map((detail) => ({
					calculationRunId: run.id,
					alternativeId: detail.alternativeId,
					criterionId: detail.criterionId,
					criterionCode: detail.criterionCode,
					criterionName: detail.criterionName,
					criterionUnit: detail.criterionUnit,
					criterionOrderIndex: detail.criterionOrderIndex,
					criterionType: detail.criterionType,
					criterionInputType: detail.criterionInputType,
					rawValue: String(detail.rawValue),
					labelValue: detail.labelValue,
					denominator: detail.denominator.toFixed(9),
					normalizedValue: detail.normalizedValue.toFixed(9),
					weight: detail.weight.toFixed(9),
					weightedValue: detail.weightedValue.toFixed(9)
				}))
			);

			return { success: true, runId: run.id };
		},
		{ isolationLevel: 'repeatable read', accessMode: 'read write' }
	);
}
