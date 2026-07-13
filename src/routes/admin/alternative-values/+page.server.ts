import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema';
import { checkDecisionMatrixCompleteness } from '$lib/server/services/decision-matrix.js';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import type { Actions } from './$types.js';

const uuidSchema = z.uuid();

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
		.where(eq(criterionScalesTable.isActive, true))
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

export const actions: Actions = {
	clear: async ({ request }) => {
		const formData = await request.formData();
		const alternativeId = uuidSchema.safeParse(formData.get('alternativeId'));

		if (!alternativeId.success) {
			return fail(400, { message: 'Alternatif tidak valid' });
		}

		try {
			const [alternative] = await db
				.select({ id: alternativesTable.id })
				.from(alternativesTable)
				.where(eq(alternativesTable.id, alternativeId.data))
				.limit(1);

			if (!alternative) return fail(404, { message: 'Alternatif tidak ditemukan' });

			await db
				.delete(alternativeCriterionValuesTable)
				.where(eq(alternativeCriterionValuesTable.alternativeId, alternativeId.data));
		} catch {
			return fail(500, { message: 'Gagal membersihkan nilai alternatif' });
		}

		return { message: 'Nilai alternatif berhasil dibersihkan' };
	}
};
