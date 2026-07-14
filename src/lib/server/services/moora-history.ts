import { asc, count, desc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db/index.js';
import {
	calculationDetailsTable,
	calculationResultsTable,
	calculationRunsTable,
	profilesTable
} from '$lib/server/db/schema/index.js';

const pageSize = 10;

const runFields = {
	id: calculationRunsTable.id,
	name: calculationRunsTable.runName,
	createdAt: calculationRunsTable.createdAt,
	createdByName: profilesTable.name,
	alternativeCount: calculationRunsTable.alternativeCount,
	criteriaCount: calculationRunsTable.criteriaCount
};

type RunRow = {
	id: string;
	name: string | null;
	createdAt: Date;
	createdByName: string | null;
	alternativeCount: number;
	criteriaCount: number;
};

export type CalculationRunSummary = {
	id: string;
	name: string;
	createdAt: Date;
	createdByName: string;
	alternativeCount: number;
	criteriaCount: number;
};

export type CalculationHistoryPage = {
	runs: CalculationRunSummary[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
};

export type CalculationRunSnapshot = {
	run: CalculationRunSummary;
	criteria: Array<{
		id: string;
		code: string;
		name: string;
		unit: string;
		type: 'benefit' | 'cost';
		weight: number;
		denominator: number;
	}>;
	alternatives: Array<{ id: string; code: string; name: string }>;
	matrixRows: Array<{
		alternativeId: string;
		raw: number[];
		labels: Array<string | null>;
		normalized: number[];
		weighted: number[];
	}>;
	results: Array<{
		alternativeId: string;
		totalBenefit: number;
		totalCost: number;
		optimizationScore: number;
		rank: number;
	}>;
};

function mapRun(run: RunRow): CalculationRunSummary {
	return {
		...run,
		name: run.name ?? `Perhitungan ${run.createdAt.toISOString()}`,
		createdByName: run.createdByName ?? 'Profil tidak tersedia'
	};
}

async function getSnapshot(run: RunRow): Promise<CalculationRunSnapshot> {
	const [resultRows, detailRows] = await Promise.all([
		db
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
			.orderBy(asc(calculationResultsTable.rank)),
		db
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
			.orderBy(
				asc(calculationDetailsTable.criterionOrderIndex),
				asc(calculationDetailsTable.alternativeId)
			)
	]);
	if (
		resultRows.length !== run.alternativeCount ||
		detailRows.length !== run.alternativeCount * run.criteriaCount
	) {
		throw new Error('Incomplete calculation snapshot');
	}

	const criterionSnapshots = new Map<
		string,
		CalculationRunSnapshot['criteria'][number] & { orderIndex: number }
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
		const details = criteria.map((criterion) => {
			const detail = detailsByCell.get(`${alternative.id}:${criterion.id}`);
			if (!detail) throw new Error('Incomplete calculation snapshot');
			return detail;
		});

		return {
			alternativeId: alternative.id,
			raw: details.map((detail) => Number(detail.rawValue)),
			labels: details.map((detail) => detail.labelValue),
			normalized: details.map((detail) => Number(detail.normalizedValue)),
			weighted: details.map((detail) => Number(detail.weightedValue))
		};
	});

	return {
		run: mapRun(run),
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

export async function getCalculationHistoryPage(
	requestedPage: number
): Promise<CalculationHistoryPage> {
	const [{ totalItems = 0 } = {}] = await db
		.select({ totalItems: count() })
		.from(calculationRunsTable);
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(requestedPage, 1), totalPages);

	if (totalItems === 0) {
		return { runs: [], pagination: { page, pageSize, totalItems, totalPages } };
	}

	const rows = await db
		.select(runFields)
		.from(calculationRunsTable)
		.leftJoin(profilesTable, eq(calculationRunsTable.createdBy, profilesTable.id))
		.orderBy(desc(calculationRunsTable.createdAt), desc(calculationRunsTable.id))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		runs: rows.map(mapRun),
		pagination: { page, pageSize, totalItems, totalPages }
	};
}

export async function getCalculationRun(id: string): Promise<CalculationRunSnapshot | null> {
	const [run] = await db
		.select(runFields)
		.from(calculationRunsTable)
		.leftJoin(profilesTable, eq(calculationRunsTable.createdBy, profilesTable.id))
		.where(eq(calculationRunsTable.id, id))
		.limit(1);

	return run ? getSnapshot(run) : null;
}

export async function getLatestCalculationRun(): Promise<CalculationRunSnapshot | null> {
	const [run] = await db
		.select(runFields)
		.from(calculationRunsTable)
		.leftJoin(profilesTable, eq(calculationRunsTable.createdBy, profilesTable.id))
		.orderBy(desc(calculationRunsTable.createdAt), desc(calculationRunsTable.id))
		.limit(1);

	return run ? getSnapshot(run) : null;
}
