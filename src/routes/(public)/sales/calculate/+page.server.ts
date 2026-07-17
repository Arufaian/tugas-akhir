import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema/index.js';
import { checkDecisionMatrixCompleteness } from '$lib/server/services/decision-matrix.js';
import { calculateMoora } from '$lib/server/services/moora.js';
import { alternativeImageSchema } from '$lib/validations/alternative.schema.js';
import { salesCalculationSchema } from '$lib/validations/sales-calculation.schema.js';

import type { Actions, PageServerLoad } from './$types.js';

const priceStep = 100_000;

async function getCurrentData() {
	// ponytail: the current catalog is small; keep filtering in-memory until measurements justify SQL joins.
	const [alternatives, criteria, values, scales] = await Promise.all([
		db
			.select({
				id: alternativesTable.id,
				code: alternativesTable.code,
				name: alternativesTable.name,
				category: alternativesTable.category,
				img: alternativesTable.img
			})
			.from(alternativesTable)
			.where(eq(alternativesTable.isActive, true))
			.orderBy(asc(alternativesTable.code)),
		db
			.select({
				id: criteriaTable.id,
				code: criteriaTable.code,
				name: criteriaTable.name,
				unit: criteriaTable.unit,
				orderIndex: criteriaTable.orderIndex,
				type: criteriaTable.type,
				inputType: criteriaTable.inputType,
				normalizedWeight: criteriaTable.normalizedWeight,
				isPrice: criteriaTable.isPrice
			})
			.from(criteriaTable)
			.where(eq(criteriaTable.isActive, true))
			.orderBy(asc(criteriaTable.orderIndex), asc(criteriaTable.code)),
		db
			.select({
				alternativeId: alternativeCriterionValuesTable.alternativeId,
				criterionId: alternativeCriterionValuesTable.criterionId,
				rawValue: alternativeCriterionValuesTable.rawValue,
				labelValue: alternativeCriterionValuesTable.labelValue
			})
			.from(alternativeCriterionValuesTable),
		db
			.select({
				criterionId: criterionScalesTable.criterionId,
				value: criterionScalesTable.value
			})
			.from(criterionScalesTable)
			.where(eq(criterionScalesTable.isActive, true))
	]);

	return { alternatives, criteria, values, scales };
}

function buildCatalog(data: Awaited<ReturnType<typeof getCurrentData>>) {
	const issues: string[] = [];
	const priceCriterion = data.criteria.find((criterion) => criterion.isPrice);

	if (!data.alternatives.length) issues.push('Belum ada motor aktif');
	if (!priceCriterion) issues.push('Admin belum menetapkan kriteria sumber harga');
	if (!priceCriterion) {
		return { catalog: [], categories: [], priceRange: null, issues };
	}

	const prices = new Map(
		data.values
			.filter((value) => value.criterionId === priceCriterion.id)
			.map((value) => [value.alternativeId, Number(value.rawValue)])
	);
	const alternativesWithoutPrice = data.alternatives.filter((alternative) => {
		const price = prices.get(alternative.id);
		return price === undefined || !Number.isFinite(price) || price < 0;
	});

	if (alternativesWithoutPrice.length) {
		issues.push(
			`Harga belum diisi atau tidak valid untuk ${alternativesWithoutPrice.map((alternative) => alternative.code).join(', ')}`
		);
		return { catalog: [], categories: [], priceRange: null, issues };
	}

	const completeness = checkDecisionMatrixCompleteness(data);
	const completenessById = new Map(
		completeness.alternatives.map((alternative) => [alternative.id, alternative.isComplete])
	);
	const catalog = data.alternatives.map((alternative) => {
		const parsedImage = alternativeImageSchema.safeParse(alternative.img);

		return {
			id: alternative.id,
			code: alternative.code,
			name: alternative.name,
			category: alternative.category ?? 'Tanpa kategori',
			price: prices.get(alternative.id)!,
			imageUrl: parsedImage.success ? parsedImage.data.url : null,
			isComplete: completenessById.get(alternative.id) ?? false
		};
	});
	const categories = [...new Set(data.alternatives.flatMap(({ category }) => category ?? []))].sort(
		(a, b) => a.localeCompare(b, 'id')
	);
	const catalogPrices = catalog.map((alternative) => alternative.price);
	const minimum = catalogPrices.length
		? Math.floor(Math.min(...catalogPrices) / priceStep) * priceStep
		: 0;
	const roundedMaximum = catalogPrices.length
		? Math.ceil(Math.max(...catalogPrices) / priceStep) * priceStep
		: 0;
	const maximum = roundedMaximum === minimum ? minimum + priceStep : roundedMaximum;
	const priceRange: [number, number] | null = catalog.length ? [minimum, maximum] : null;

	return { catalog, categories, priceRange, issues };
}

export const load: PageServerLoad = async () => {
	try {
		const currentData = await getCurrentData();
		const catalogData = buildCatalog(currentData);

		return {
			...catalogData,
			form: await superValidate(
				{ category: 'all', priceRange: catalogData.priceRange ?? [0, 0] },
				zod4(salesCalculationSchema)
			)
		};
	} catch {
		error(500, 'Katalog motor gagal dimuat');
	}
};

export const actions: Actions = {
	calculate: async (event) => {
		const form = await superValidate(event, zod4(salesCalculationSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const currentData = await getCurrentData();
			const catalogData = buildCatalog(currentData);

			if (catalogData.issues.length) {
				return fail(400, { form, issues: catalogData.issues });
			}
			if (form.data.category !== 'all' && !catalogData.categories.includes(form.data.category)) {
				return setError(form, 'category', 'Kategori tidak tersedia');
			}

			const [minimumPrice, maximumPrice] = form.data.priceRange;
			const candidates = catalogData.catalog.filter(
				(alternative) =>
					(form.data.category === 'all' || alternative.category === form.data.category) &&
					alternative.price >= minimumPrice &&
					alternative.price <= maximumPrice
			);

			if (candidates.length < 2) {
				return fail(400, {
					form,
					issues: [
						candidates.length
							? 'Perhitungan membutuhkan minimal dua motor'
							: 'Tidak ada motor yang sesuai dengan filter'
					]
				});
			}
			if (candidates.some((candidate) => !candidate.isComplete)) {
				return fail(400, { form, issues: ['Data kandidat belum lengkap'] });
			}

			const candidateIds = new Set(candidates.map((candidate) => candidate.id));
			const criterionIds = new Set(currentData.criteria.map((criterion) => criterion.id));
			const calculation = calculateMoora({
				alternatives: candidates.map(({ id, code, name }) => ({ id, code, name })),
				criteria: currentData.criteria,
				values: currentData.values.filter(
					(value) => candidateIds.has(value.alternativeId) && criterionIds.has(value.criterionId)
				),
				scales: currentData.scales
			});

			if (!calculation.success) return fail(400, { form, issues: calculation.issues });

			const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));

			return {
				form,
				calculation: {
					filter: {
						category: form.data.category,
						priceRange: form.data.priceRange
					},
					results: calculation.results.map((result) => ({
						...candidatesById.get(result.id)!,
						totalBenefit: result.totalBenefit,
						totalCost: result.totalCost,
						optimizationScore: result.optimizationScore,
						rank: result.rank
					}))
				}
			};
		} catch {
			return fail(500, { form, issues: ['Gagal menjalankan perhitungan MOORA'] });
		}
	}
};
