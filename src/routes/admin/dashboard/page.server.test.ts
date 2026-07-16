import { beforeEach, describe, expect, it, vi } from 'vitest';

import { load } from './+page.server.js';

const { mockSelect, mockGetLatestRun } = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockGetLatestRun: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ db: { select: mockSelect } }));
vi.mock('$lib/server/services/moora-history.js', () => ({
	getLatestCalculationRun: mockGetLatestRun
}));

function orderedQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function filteredQuery(rows: unknown[]) {
	return { from: () => ({ where: async () => rows }) };
}

function recentQuery(rows: unknown[]) {
	return {
		from: () => ({
			leftJoin: () => ({ orderBy: () => ({ limit: async () => rows }) })
		})
	};
}

function setupDashboard({ empty = false }: { empty?: boolean } = {}) {
	const alternatives = empty ? [] : [{ id: 'a1', code: 'A1', name: 'Alternative 1' }];
	const criteria = empty
		? []
		: [
				{
					id: 'c1',
					code: 'C1',
					name: 'Kualitas',
					unit: 'poin',
					orderIndex: 1,
					type: 'benefit',
					inputType: 'number',
					normalizedWeight: '1.000000000'
				}
			];
	const values = empty
		? []
		: [
				{
					alternativeId: 'a1',
					criterionId: 'c1',
					rawValue: '10.0000',
					labelValue: null
				}
			];
	const recentAt = new Date('2026-07-14T08:00:00.000Z');

	mockSelect
		.mockReturnValueOnce(orderedQuery(alternatives))
		.mockReturnValueOnce(orderedQuery(criteria))
		.mockReturnValueOnce(rowsQuery(values))
		.mockReturnValueOnce(filteredQuery([]))
		.mockReturnValueOnce(rowsQuery([{ totalRunCount: empty ? 0 : 4 }]))
		.mockReturnValueOnce(
			recentQuery(
				empty
					? []
					: [
							{
								id: 'run-1',
								name: null,
								createdAt: recentAt,
								createdByName: null,
								alternativeCount: 1,
								criteriaCount: 1
							}
						]
			)
		);

	return { recentAt };
}

describe('admin dashboard load', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns a ready summary and maps recent-run fallbacks', async () => {
		const { recentAt } = setupDashboard();
		mockGetLatestRun.mockResolvedValue({ run: { id: 'run-1' }, results: [] });

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected dashboard data');
		expect(result.summary).toEqual({
			activeAlternativeCount: 1,
			activeCriteriaCount: 1,
			totalCellCount: 1,
			filledCellCount: 1,
			completionPercentage: 100,
			totalRunCount: 4
		});
		expect(result.readiness).toEqual({ isReady: true, issues: [] });
		expect(result.recentRuns).toEqual([
			{
				id: 'run-1',
				name: `Perhitungan ${recentAt.toISOString()}`,
				createdAt: recentAt,
				createdByName: 'Profil tidak tersedia',
				alternativeCount: 1,
				criteriaCount: 1
			}
		]);
	});

	it('uses zero percent and reports not ready when master data is empty', async () => {
		setupDashboard({ empty: true });
		mockGetLatestRun.mockResolvedValue(null);

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected dashboard data');
		expect(result.summary.completionPercentage).toBe(0);
		expect(result.summary.totalCellCount).toBe(0);
		expect(result.readiness.isReady).toBe(false);
		expect(result.latestRun).toBeNull();
		expect(result.recentRuns).toEqual([]);
	});

	it('returns a generic error when a dashboard query fails', async () => {
		mockSelect.mockImplementation(() => {
			throw new Error('sensitive database details');
		});

		await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 500,
			body: { message: 'Dashboard gagal dimuat' }
		});
	});
});
