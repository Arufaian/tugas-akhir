import { fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	calculationDetailsTable,
	calculationResultsTable,
	calculationRunsTable,
	criteriaTable,
	criterionScalesTable,
	profilesTable
} from '$lib/server/db/schema/index.js';
import { createMooraCalculation } from '$lib/server/services/moora-persistence.js';
import { calculateMoora } from '$lib/server/services/moora.js';

import type { Actions, PageServerLoad } from './$types.js';

async function getReadiness() {
	// ponytail: keep this read model local until another page needs the same current-data view.
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
			unit: criteriaTable.unit,
			orderIndex: criteriaTable.orderIndex,
			type: criteriaTable.type,
			inputType: criteriaTable.inputType,
			normalizedWeight: criteriaTable.normalizedWeight
		})
		.from(criteriaTable)
		.where(eq(criteriaTable.isActive, true))
		.orderBy(asc(criteriaTable.orderIndex), asc(criteriaTable.code));
	const values = await db
		.select({
			alternativeId: alternativeCriterionValuesTable.alternativeId,
			criterionId: alternativeCriterionValuesTable.criterionId,
			rawValue: alternativeCriterionValuesTable.rawValue,
			labelValue: alternativeCriterionValuesTable.labelValue
		})
		.from(alternativeCriterionValuesTable);
	const scales = await db
		.select({
			criterionId: criterionScalesTable.criterionId,
			value: criterionScalesTable.value
		})
		.from(criterionScalesTable)
		.where(eq(criterionScalesTable.isActive, true));
	const calculation = calculateMoora({ alternatives, criteria, values, scales });

	return calculation.success
		? { isReady: true, issues: [] as string[] }
		: { isReady: false, issues: calculation.issues };
}

async function getLatestRun() {
	const [run] = await db
		.select({
			id: calculationRunsTable.id,
			name: calculationRunsTable.runName,
			createdAt: calculationRunsTable.createdAt,
			createdByName: profilesTable.name,
			alternativeCount: calculationRunsTable.alternativeCount,
			criteriaCount: calculationRunsTable.criteriaCount
		})
		.from(calculationRunsTable)
		.leftJoin(profilesTable, eq(calculationRunsTable.createdBy, profilesTable.id))
		.orderBy(desc(calculationRunsTable.createdAt), desc(calculationRunsTable.id))
		.limit(1);

	if (!run) {
		return { run: null, criteria: [], alternatives: [], matrixRows: [], results: [] };
	}

	const resultRows = await db
		.select({
			alternativeId: calculationResultsTable.alternativeId,
			alternativeCode: calculationResultsTable.alternativeCode,
			alternativeName: calculationResultsTable.alternativeName,
			totalBenefit: calculationResultsTable.totalBenefit,
			totalCost: calculationResultsTable.totalCost,
			optimizationScore: calculationResultsTable.optimizationScore,
			rank: calculationResultsTable.rank
		})
		.from(calculationResultsTable)
		.where(eq(calculationResultsTable.calculationRunId, run.id))
		.orderBy(asc(calculationResultsTable.rank));
	const detailRows = await db
		.select({
			alternativeId: calculationDetailsTable.alternativeId,
			criterionId: calculationDetailsTable.criterionId,
			criterionCode: calculationDetailsTable.criterionCode,
			criterionName: calculationDetailsTable.criterionName,
			criterionUnit: calculationDetailsTable.criterionUnit,
			criterionOrderIndex: calculationDetailsTable.criterionOrderIndex,
			criterionType: calculationDetailsTable.criterionType,
			rawValue: calculationDetailsTable.rawValue,
			labelValue: calculationDetailsTable.labelValue,
			denominator: calculationDetailsTable.denominator,
			weight: calculationDetailsTable.weight,
			normalizedValue: calculationDetailsTable.normalizedValue,
			weightedValue: calculationDetailsTable.weightedValue
		})
		.from(calculationDetailsTable)
		.where(eq(calculationDetailsTable.calculationRunId, run.id))
		.orderBy(asc(calculationDetailsTable.criterionOrderIndex));
	const criterionSnapshots = new Map<
		string,
		{
			id: string;
			code: string;
			name: string;
			unit: string;
			type: 'benefit' | 'cost';
			weight: number;
			denominator: number;
			orderIndex: number;
		}
	>();

	for (const detail of detailRows) {
		if (!criterionSnapshots.has(detail.criterionId)) {
			criterionSnapshots.set(detail.criterionId, {
				id: detail.criterionId,
				code: detail.criterionCode,
				name: detail.criterionName,
				unit: detail.criterionUnit,
				type: detail.criterionType,
				weight: Number(detail.weight),
				denominator: Number(detail.denominator),
				orderIndex: detail.criterionOrderIndex
			});
		}
	}

	const criteria = [...criterionSnapshots.values()]
		.sort((a, b) => a.orderIndex - b.orderIndex || a.code.localeCompare(b.code))
		.map((criterion) => ({
			id: criterion.id,
			code: criterion.code,
			name: criterion.name,
			unit: criterion.unit,
			type: criterion.type,
			weight: criterion.weight,
			denominator: criterion.denominator
		}));
	const alternatives = resultRows
		.map((result) => ({
			id: result.alternativeId,
			code: result.alternativeCode,
			name: result.alternativeName
		}))
		.sort((a, b) => a.code.localeCompare(b.code));
	const detailsByCell = new Map(
		detailRows.map((detail) => [`${detail.alternativeId}:${detail.criterionId}`, detail])
	);
	const matrixRows = alternatives.map((alternative) => {
		const details = criteria.map(
			(criterion) => detailsByCell.get(`${alternative.id}:${criterion.id}`)!
		);

		return {
			alternativeId: alternative.id,
			raw: details.map((detail) => Number(detail.rawValue)),
			labels: details.map((detail) => detail.labelValue),
			normalized: details.map((detail) => Number(detail.normalizedValue)),
			weighted: details.map((detail) => Number(detail.weightedValue))
		};
	});

	return {
		run: {
			...run,
			name: run.name ?? `Perhitungan ${run.createdAt.toISOString()}`,
			createdByName: run.createdByName ?? 'Administrator'
		},
		criteria,
		alternatives,
		matrixRows,
		results: resultRows.map((result) => ({
			alternativeId: result.alternativeId,
			totalBenefit: Number(result.totalBenefit),
			totalCost: Number(result.totalCost),
			optimizationScore: Number(result.optimizationScore),
			rank: result.rank
		}))
	};
}

export const load: PageServerLoad = async () => {
	const readiness = await getReadiness();
	return { readiness, ...(await getLatestRun()) };
};

export const actions: Actions = {
	calculate: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Sesi tidak valid' });

		try {
			const result = await createMooraCalculation(user.id);
			if (!result.success) {
				return fail(400, {
					message: 'Data belum siap untuk dihitung',
					issues: result.issues
				});
			}

			return {
				success: true,
				runId: result.runId,
				message: 'Perhitungan MOORA berhasil disimpan'
			};
		} catch {
			return fail(500, { message: 'Gagal menjalankan perhitungan MOORA' });
		}
	}
};
