import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getCalculationHistoryPage,
	getCalculationRun,
	getLatestCalculationRun
} from './moora-history.js';

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock('$lib/server/db/index.js', () => ({ db: { select: mockSelect } }));

const run = {
	id: '00000000-0000-4000-8000-000000000001',
	name: 'Perhitungan Test',
	createdAt: new Date('2026-07-14T08:00:00.000Z'),
	createdByName: 'Admin Test',
	alternativeCount: 1,
	criteriaCount: 1
};

const resultRows = [
	{
		alternativeId: 'a1',
		alternativeCode: 'A1',
		alternativeName: 'Snapshot Alternative',
		totalBenefit: '1.000000000',
		totalCost: '0.250000000',
		optimizationScore: '0.750000000',
		rank: 1
	}
];

const detailRows = [
	{
		alternativeId: 'a1',
		criterionId: 'c1',
		criterionCode: 'C1',
		criterionName: 'Snapshot Criterion',
		criterionUnit: 'poin',
		criterionOrderIndex: 1,
		criterionType: 'benefit' as const,
		rawValue: '10.0000',
		labelValue: 'Baik',
		denominator: '10.000000000',
		weight: '1.000000000',
		normalizedValue: '1.000000000',
		weightedValue: '1.000000000'
	}
];

function countQuery(totalItems: number) {
	return { from: async () => [{ totalItems }] };
}

function historyQuery(rows: unknown[], recordOffset: (value: number) => void) {
	return {
		from: () => ({
			leftJoin: () => ({
				orderBy: () => ({
					limit: () => ({
						offset: (value: number) => {
							recordOffset(value);
							return Promise.resolve(rows);
						}
					})
				})
			})
		})
	};
}

function runByIdQuery(rows: unknown[]) {
	return {
		from: () => ({
			leftJoin: () => ({ where: () => ({ limit: async () => rows }) })
		})
	};
}

function latestRunQuery(rows: unknown[]) {
	return {
		from: () => ({
			leftJoin: () => ({ orderBy: () => ({ limit: async () => rows }) })
		})
	};
}

function snapshotQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

describe('MOORA history read service', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns clamped pagination and neutral metadata fallbacks', async () => {
		const offset = vi.fn();
		mockSelect.mockReturnValueOnce(countQuery(12)).mockReturnValueOnce(
			historyQuery(
				[
					{
						...run,
						name: null,
						createdByName: null
					}
				],
				offset
			)
		);

		const result = await getCalculationHistoryPage(99);

		expect(offset).toHaveBeenCalledWith(10);
		expect(result.pagination).toEqual({ page: 2, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(result.runs[0]).toMatchObject({
			name: 'Perhitungan 2026-07-14T08:00:00.000Z',
			createdByName: 'Profil tidak tersedia'
		});
	});

	it('returns a stable empty page without running a list query', async () => {
		mockSelect.mockReturnValueOnce(countQuery(0));

		await expect(getCalculationHistoryPage(1)).resolves.toEqual({
			runs: [],
			pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }
		});
		expect(mockSelect).toHaveBeenCalledTimes(1);
	});

	it('maps persisted snapshot rows and numeric values to the UI contract', async () => {
		mockSelect
			.mockReturnValueOnce(runByIdQuery([run]))
			.mockReturnValueOnce(snapshotQuery(resultRows))
			.mockReturnValueOnce(snapshotQuery(detailRows));

		const result = await getCalculationRun(run.id);

		expect(result).toMatchObject({
			run,
			criteria: [
				{
					id: 'c1',
					code: 'C1',
					name: 'Snapshot Criterion',
					unit: 'poin',
					type: 'benefit',
					weight: 1,
					denominator: 10
				}
			],
			alternatives: [{ id: 'a1', code: 'A1', name: 'Snapshot Alternative' }],
			matrixRows: [
				{
					alternativeId: 'a1',
					raw: [10],
					labels: ['Baik'],
					normalized: [1],
					weighted: [1]
				}
			],
			results: [
				{
					alternativeId: 'a1',
					totalBenefit: 1,
					totalCost: 0.25,
					optimizationScore: 0.75,
					rank: 1
				}
			]
		});
	});

	it('returns null when a run does not exist', async () => {
		mockSelect.mockReturnValueOnce(runByIdQuery([]));

		await expect(getCalculationRun(run.id)).resolves.toBeNull();
		expect(mockSelect).toHaveBeenCalledTimes(1);
	});

	it('rejects an incomplete snapshot', async () => {
		mockSelect
			.mockReturnValueOnce(runByIdQuery([run]))
			.mockReturnValueOnce(snapshotQuery(resultRows))
			.mockReturnValueOnce(snapshotQuery([]));

		await expect(getCalculationRun(run.id)).rejects.toThrow('Incomplete calculation snapshot');
	});

	it('returns null when no latest run exists', async () => {
		mockSelect.mockReturnValueOnce(latestRunQuery([]));

		await expect(getLatestCalculationRun()).resolves.toBeNull();
	});
});
