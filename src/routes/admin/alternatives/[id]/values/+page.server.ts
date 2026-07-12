import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema/index.js';
import { canonicalDecimal } from '$lib/utils/decimal.js';
import { calculateTechnologyScore } from '$lib/utils/technology-features.js';
import { alternativeCriterionValuesSchema } from '$lib/validations/alternative-criterion-value.schema.js';

import type { Actions, PageServerLoad } from './$types.js';

const uuidSchema = z.uuid();
const decimalPattern = /^\d{1,10}(?:\.\d{1,4})?$/;

function parseFeatureIds(labelValue: string | null): string[] {
	if (!labelValue) return [];

	try {
		const value: unknown = JSON.parse(labelValue);
		if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) return [];
		calculateTechnologyScore(value);
		return value;
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ params }) => {
	const alternativeId = uuidSchema.safeParse(params.id);
	if (!alternativeId.success) error(404, 'Alternatif tidak ditemukan');

	const [alternative] = await db
		.select({
			id: alternativesTable.id,
			code: alternativesTable.code,
			name: alternativesTable.name
		})
		.from(alternativesTable)
		.where(and(eq(alternativesTable.id, alternativeId.data), eq(alternativesTable.isActive, true)))
		.limit(1);

	if (!alternative) error(404, 'Alternatif tidak ditemukan');

	const activeCriteria = await db
		.select({
			id: criteriaTable.id,
			code: criteriaTable.code,
			name: criteriaTable.name,
			description: criteriaTable.description,
			unit: criteriaTable.unit,
			inputType: criteriaTable.inputType
		})
		.from(criteriaTable)
		.where(eq(criteriaTable.isActive, true))
		.orderBy(asc(criteriaTable.orderIndex));

	const criterionIds = activeCriteria.map((criterion) => criterion.id);
	const [scales, existingValues] = criterionIds.length
		? await Promise.all([
				db
					.select({
						criterionId: criterionScalesTable.criterionId,
						label: criterionScalesTable.label,
						value: criterionScalesTable.value
					})
					.from(criterionScalesTable)
					.where(inArray(criterionScalesTable.criterionId, criterionIds))
					.orderBy(asc(criterionScalesTable.orderIndex)),
				db
					.select({
						criterionId: alternativeCriterionValuesTable.criterionId,
						rawValue: alternativeCriterionValuesTable.rawValue,
						labelValue: alternativeCriterionValuesTable.labelValue
					})
					.from(alternativeCriterionValuesTable)
					.where(
						and(
							eq(alternativeCriterionValuesTable.alternativeId, alternative.id),
							inArray(alternativeCriterionValuesTable.criterionId, criterionIds)
						)
					)
			])
		: [[], []];

	const scalesByCriterionId = new Map<string, typeof scales>();
	for (const scale of scales) {
		const criterionScales = scalesByCriterionId.get(scale.criterionId) ?? [];
		criterionScales.push(scale);
		scalesByCriterionId.set(scale.criterionId, criterionScales);
	}

	const valuesByCriterionId = new Map(existingValues.map((value) => [value.criterionId, value]));
	const criteria = activeCriteria.map((criterion) => ({
		...criterion,
		scales: scalesByCriterionId.get(criterion.id) ?? []
	}));

	return {
		alternative,
		criteria,
		form: await superValidate(
			{
				values: activeCriteria.map((criterion) => {
					const existing = valuesByCriterionId.get(criterion.id);
					return {
						criterionId: criterion.id,
						value:
							criterion.inputType === 'tech_features'
								? ''
								: criterion.inputType === 'number' && existing
									? canonicalDecimal(existing.rawValue)
									: (existing?.rawValue ?? ''),
						selectedFeatureIds:
							criterion.inputType === 'tech_features'
								? parseFeatureIds(existing?.labelValue ?? null)
								: [],
						isAssessed: criterion.inputType === 'tech_features' && existing !== undefined
					};
				})
			},
			zod4(alternativeCriterionValuesSchema)
		)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(alternativeCriterionValuesSchema));
		if (!form.valid) return fail(400, { form });

		const alternativeId = uuidSchema.safeParse(event.params.id);
		if (!alternativeId.success) {
			return message(form, { type: 'error', text: 'Alternatif tidak ditemukan' }, { status: 404 });
		}

		try {
			const validationFailure = await db.transaction(async (tx) => {
				const [alternative] = await tx
					.select({ id: alternativesTable.id })
					.from(alternativesTable)
					.where(
						and(eq(alternativesTable.id, alternativeId.data), eq(alternativesTable.isActive, true))
					)
					.limit(1);

				if (!alternative) {
					return message(
						form,
						{ type: 'error', text: 'Alternatif tidak ditemukan' },
						{ status: 404 }
					);
				}

				const activeCriteria = await tx
					.select({ id: criteriaTable.id, inputType: criteriaTable.inputType })
					.from(criteriaTable)
					.where(eq(criteriaTable.isActive, true))
					.orderBy(asc(criteriaTable.orderIndex));

				const payloadByCriterionId = new Map(
					form.data.values.map((value, index) => [value.criterionId, { value, index }])
				);
				const activeCriterionIds = new Set(activeCriteria.map((criterion) => criterion.id));
				const hasInvalidCriteria =
					payloadByCriterionId.size !== form.data.values.length ||
					form.data.values.length !== activeCriteria.length ||
					form.data.values.some((value) => !activeCriterionIds.has(value.criterionId));

				if (hasInvalidCriteria) {
					return message(
						form,
						{ type: 'error', text: 'Daftar kriteria sudah berubah, muat ulang halaman' },
						{ status: 400 }
					);
				}

				const criterionIds = activeCriteria.map((criterion) => criterion.id);
				const scales = criterionIds.length
					? await tx
							.select({
								criterionId: criterionScalesTable.criterionId,
								label: criterionScalesTable.label,
								value: criterionScalesTable.value
							})
							.from(criterionScalesTable)
							.where(inArray(criterionScalesTable.criterionId, criterionIds))
							.for('key share')
					: [];
				const scalesByCriterionAndValue = new Map(
					scales.map((scale) => [`${scale.criterionId}:${canonicalDecimal(scale.value)}`, scale])
				);
				const rows: (typeof alternativeCriterionValuesTable.$inferInsert)[] = [];
				const deleteCriterionIds: string[] = [];
				const updatedAt = new Date();

				for (const criterion of activeCriteria) {
					const submitted = payloadByCriterionId.get(criterion.id)!;
					const path = `values[${submitted.index}]` as const;

					if (criterion.inputType !== 'tech_features' && !submitted.value.value) {
						deleteCriterionIds.push(criterion.id);
						continue;
					}

					if (criterion.inputType === 'number') {
						if (!decimalPattern.test(submitted.value.value)) {
							return setError(
								form,
								`${path}.value`,
								'Nilai harus non-negatif, maksimal 10 digit dan 4 angka desimal'
							);
						}

						rows.push({
							alternativeId: alternative.id,
							criterionId: criterion.id,
							rawValue: submitted.value.value,
							labelValue: null,
							updatedAt
						});
						continue;
					}

					if (criterion.inputType === 'scale') {
						const scale = scalesByCriterionAndValue.get(
							`${criterion.id}:${canonicalDecimal(submitted.value.value)}`
						);
						if (!scale) return setError(form, `${path}.value`, 'Nilai skala tidak valid');

						rows.push({
							alternativeId: alternative.id,
							criterionId: criterion.id,
							rawValue: scale.value,
							labelValue: scale.label,
							updatedAt
						});
						continue;
					}

					if (!submitted.value.isAssessed) {
						deleteCriterionIds.push(criterion.id);
						continue;
					}

					let score: number;
					try {
						score = calculateTechnologyScore(submitted.value.selectedFeatureIds);
					} catch {
						return setError(form, `${path}.selectedFeatureIds._errors`, 'Daftar fitur tidak valid');
					}

					rows.push({
						alternativeId: alternative.id,
						criterionId: criterion.id,
						rawValue: String(score),
						labelValue: JSON.stringify(submitted.value.selectedFeatureIds),
						updatedAt
					});
				}

				if (deleteCriterionIds.length) {
					await tx
						.delete(alternativeCriterionValuesTable)
						.where(
							and(
								eq(alternativeCriterionValuesTable.alternativeId, alternative.id),
								inArray(alternativeCriterionValuesTable.criterionId, deleteCriterionIds)
							)
						);
				}

				if (rows.length) {
					await tx
						.insert(alternativeCriterionValuesTable)
						.values(rows)
						.onConflictDoUpdate({
							target: [
								alternativeCriterionValuesTable.alternativeId,
								alternativeCriterionValuesTable.criterionId
							],
							set: {
								rawValue: sql`excluded.raw_value`,
								labelValue: sql`excluded.label_value`,
								updatedAt
							}
						});
				}
			});

			if (validationFailure) return validationFailure;
		} catch {
			return message(
				form,
				{ type: 'error', text: 'Gagal menyimpan nilai alternatif' },
				{ status: 500 }
			);
		}

		return message(form, { type: 'success', text: 'Nilai alternatif berhasil disimpan' });
	}
};
