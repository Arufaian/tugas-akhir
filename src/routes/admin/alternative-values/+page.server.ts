import { db } from '$lib/server/db';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema';
import { checkDecisionMatrixCompleteness } from '$lib/server/services/decision-matrix.js';
import { asc, eq } from 'drizzle-orm';

export async function load() {
	const alternatives = await db
		.select({
			id: alternativesTable.id,
			code: alternativesTable.code,
			name: alternativesTable.name
		})
		.from(alternativesTable)
		.where(eq(alternativesTable.isActive, true))
		.orderBy(asc(alternativesTable.code));

	const criteria = await db
		.select({
			id: criteriaTable.id,
			code: criteriaTable.code,
			name: criteriaTable.name,
			type: criteriaTable.type,
			inputType: criteriaTable.inputType,
			normalizedWeight: criteriaTable.normalizedWeight
		})
		.from(criteriaTable)
		.where(eq(criteriaTable.isActive, true))
		.orderBy(asc(criteriaTable.orderIndex));

	const criterionScales = await db
		.select({
			criterionId: criterionScalesTable.criterionId,
			label: criterionScalesTable.label,
			value: criterionScalesTable.value
		})
		.from(criterionScalesTable)
		.orderBy(asc(criterionScalesTable.orderIndex));

	const values = await db
		.select({
			alternativeId: alternativeCriterionValuesTable.alternativeId,
			criterionId: alternativeCriterionValuesTable.criterionId,
			rawValue: alternativeCriterionValuesTable.rawValue,
			labelValue: alternativeCriterionValuesTable.labelValue
		})
		.from(alternativeCriterionValuesTable);

	const completeness = checkDecisionMatrixCompleteness({
		alternatives,
		criteria,
		values,
		scales: criterionScales
	});
	const scaleCriterionIds = new Set(criterionScales.map((s) => s.criterionId));
	const emptyScaleCriteria = criteria.filter(
		(c) => c.inputType === 'scale' && !scaleCriterionIds.has(c.id)
	);

	// ponytail: MOORA readiness only cares about active criteria on this page.
	const normalizedSum = criteria.reduce((sum, c) => sum + Number(c.normalizedWeight), 0);
	const needsNormalization =
		criteria.length > 0 &&
		(Math.abs(normalizedSum - 1) > 0.0001 ||
			criteria.some((c) => Number(c.normalizedWeight) === 0));

	return {
		alternatives,
		criteria,
		criterionScales,
		completeness,
		emptyScaleCriteria,
		normalizedSum,
		needsNormalization,
		summary: {
			activeAlternativeCount: alternatives.length,
			activeCriteriaCount: criteria.length,
			totalCellCount: completeness.totalCellCount,
			filledCellCount: completeness.filledCellCount,
			emptyCellCount: completeness.emptyCellCount
		}
	};
}
