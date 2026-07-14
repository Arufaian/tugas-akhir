import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema/index.js';
import { getLatestCalculationRun } from '$lib/server/services/moora-history.js';
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

export const load: PageServerLoad = async () => {
	const readiness = await getReadiness();
	const latestRun = await getLatestCalculationRun();

	return latestRun
		? { readiness, ...latestRun }
		: { readiness, run: null, criteria: [], alternatives: [], matrixRows: [], results: [] };
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
