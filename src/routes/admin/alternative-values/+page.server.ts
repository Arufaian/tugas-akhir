import { db } from '$lib/server/db';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';

export async function load() {
	const alternatives = await db
		.select({ id: alternativesTable.id, code: alternativesTable.code, name: alternativesTable.name })
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

	const activeAlternativeIds = new Set(alternatives.map((a) => a.id));
	const activeCriterionIds = new Set(criteria.map((c) => c.id));
	const activeValues = values.filter(
		(v) => activeAlternativeIds.has(v.alternativeId) && activeCriterionIds.has(v.criterionId)
	);
	const filledCellCount = activeValues.length;
	const totalCellCount = alternatives.length * criteria.length;
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
		values: activeValues,
		emptyScaleCriteria,
		normalizedSum,
		needsNormalization,
		summary: {
			activeAlternativeCount: alternatives.length,
			activeCriteriaCount: criteria.length,
			totalCellCount,
			filledCellCount,
			emptyCellCount: totalCellCount - filledCellCount
		}
	};
}

export const actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		const alternatives = await db
			.select({ id: alternativesTable.id })
			.from(alternativesTable)
			.where(eq(alternativesTable.isActive, true));
		const criteria = await db
			.select({ id: criteriaTable.id, inputType: criteriaTable.inputType })
			.from(criteriaTable)
			.where(eq(criteriaTable.isActive, true));
		const scales = await db
			.select({
				criterionId: criterionScalesTable.criterionId,
				label: criterionScalesTable.label,
				value: criterionScalesTable.value
			})
			.from(criterionScalesTable);

		const activeAlternativeIds = new Set(alternatives.map((a) => a.id));
		const criteriaById = new Map(criteria.map((c) => [c.id, c]));
		const scaleByCell = new Map(scales.map((s) => [`${s.criterionId}:${s.value}`, s]));
		const rows = [];

		for (const [name, value] of formData) {
			if (!name.startsWith('value:') || typeof value !== 'string' || value === '') continue;

			const [, alternativeId, criterionId] = name.split(':');
			const criterion = criteriaById.get(criterionId);
			const rawValue = Number(value);

			if (!activeAlternativeIds.has(alternativeId) || !criterion) {
				return fail(400, { error: 'Nilai berisi alternatif atau kriteria tidak aktif' });
			}

			if (!Number.isFinite(rawValue) || rawValue < 0) {
				return fail(400, { error: 'Nilai harus berupa angka non-negatif' });
			}

			const scale = criterion.inputType === 'scale' ? scaleByCell.get(`${criterionId}:${value}`) : null;

			if (criterion.inputType === 'scale' && !scale) {
				return fail(400, { error: 'Nilai skala tidak valid' });
			}

			rows.push({
				alternativeId,
				criterionId,
				rawValue: String(rawValue),
				labelValue: scale?.label ?? null,
				updatedAt: new Date()
			});
		}

		if (rows.length === 0) return fail(400, { error: 'Tidak ada nilai untuk disimpan' });

		for (const row of rows) {
			await db
				.insert(alternativeCriterionValuesTable)
				.values(row)
				.onConflictDoUpdate({
					target: [
						alternativeCriterionValuesTable.alternativeId,
						alternativeCriterionValuesTable.criterionId
					],
					set: {
						rawValue: row.rawValue,
						labelValue: row.labelValue,
						updatedAt: row.updatedAt
					}
				});
		}

		return { success: true, savedCount: rows.length };
	}
};
