import { error } from '@sveltejs/kit';
import { asc, count, desc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	calculationRunsTable,
	criteriaTable,
	criterionScalesTable,
	profilesTable
} from '$lib/server/db/schema/index.js';
import { checkDecisionMatrixCompleteness } from '$lib/server/services/decision-matrix.js';
import { getLatestCalculationRun } from '$lib/server/services/moora-history.js';
import { calculateMoora } from '$lib/server/services/moora.js';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		// ponytail: keep this dashboard-specific aggregate local until another route needs it.
		const [
			alternatives,
			criteria,
			values,
			scales,
			[{ totalRunCount = 0 } = {}],
			recentRows,
			latestRun
		] = await Promise.all([
			db
				.select({
					id: alternativesTable.id,
					code: alternativesTable.code,
					name: alternativesTable.name
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
					normalizedWeight: criteriaTable.normalizedWeight
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
				.where(eq(criterionScalesTable.isActive, true)),
			db.select({ totalRunCount: count() }).from(calculationRunsTable),
			db
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
				.limit(3),
			getLatestCalculationRun()
		]);

		const completeness = checkDecisionMatrixCompleteness({
			alternatives,
			criteria,
			values,
			scales
		});
		const calculation = calculateMoora({ alternatives, criteria, values, scales });
		const completionPercentage = completeness.totalCellCount
			? Math.round((completeness.filledCellCount / completeness.totalCellCount) * 100)
			: 0;

		return {
			summary: {
				activeAlternativeCount: alternatives.length,
				activeCriteriaCount: criteria.length,
				totalCellCount: completeness.totalCellCount,
				filledCellCount: completeness.filledCellCount,
				completionPercentage,
				totalRunCount
			},
			readiness: calculation.success
				? { isReady: true, issues: [] as string[] }
				: { isReady: false, issues: calculation.issues },
			latestRun,
			recentRuns: recentRows.map((run) => ({
				...run,
				name: run.name ?? `Perhitungan ${run.createdAt.toISOString()}`,
				createdByName: run.createdByName ?? 'Profil tidak tersedia'
			}))
		};
	} catch {
		error(500, 'Dashboard gagal dimuat');
	}
};
