import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server.js';

const { mockSelect, mockCalculateMoora, mockCreateMooraCalculation, mockGetLatestRun } = vi.hoisted(
	() => ({
		mockSelect: vi.fn(),
		mockCalculateMoora: vi.fn(),
		mockCreateMooraCalculation: vi.fn(),
		mockGetLatestRun: vi.fn()
	})
);

vi.mock('$lib/server/db/index.js', () => ({ db: { select: mockSelect } }));
vi.mock('$lib/server/services/moora.js', () => ({ calculateMoora: mockCalculateMoora }));
vi.mock('$lib/server/services/moora-persistence.js', () => ({
	createMooraCalculation: mockCreateMooraCalculation
}));
vi.mock('$lib/server/services/moora-history.js', () => ({
	getLatestCalculationRun: mockGetLatestRun
}));

function activeQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function filteredQuery(rows: unknown[]) {
	return { from: () => ({ where: async () => rows }) };
}

function setupReadiness() {
	mockSelect
		.mockReturnValueOnce(activeQuery([{ id: 'a1', code: 'A1', name: 'Alternative 1' }]))
		.mockReturnValueOnce(
			activeQuery([
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
			])
		)
		.mockReturnValueOnce(
			rowsQuery([
				{
					alternativeId: 'a1',
					criterionId: 'c1',
					rawValue: '10.0000',
					labelValue: null
				}
			])
		)
		.mockReturnValueOnce(filteredQuery([]));
}

function actionEvent(userId: string | null) {
	return {
		locals: {
			safeGetSession: async () => ({
				session: userId ? {} : null,
				user: userId ? { id: userId } : null
			})
		}
	} as Parameters<NonNullable<typeof actions.calculate>>[0];
}

describe('MOORA calculation page load', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns readiness issues and an empty state without a saved run', async () => {
		setupReadiness();
		mockGetLatestRun.mockResolvedValue(null);
		mockCalculateMoora.mockReturnValue({
			success: false,
			issues: ['Decision matrix belum lengkap']
		});

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toEqual({
			readiness: { isReady: false, issues: ['Decision matrix belum lengkap'] },
			run: null,
			criteria: [],
			alternatives: [],
			matrixRows: [],
			results: []
		});
	});

	it('returns the latest persisted snapshot from the history service', async () => {
		setupReadiness();
		mockCalculateMoora.mockReturnValue({ success: true });
		mockGetLatestRun.mockResolvedValue({
			run: {
				id: 'run-1',
				name: 'Perhitungan Test',
				createdAt: new Date('2026-07-14T08:00:00.000Z'),
				createdByName: 'Admin Test',
				alternativeCount: 1,
				criteriaCount: 1
			},
			alternatives: [{ id: 'a1', code: 'A1', name: 'Snapshot Alternative' }],
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
			matrixRows: [
				{
					alternativeId: 'a1',
					raw: [10],
					labels: [null],
					normalized: [1],
					weighted: [1]
				}
			],
			results: [
				{
					alternativeId: 'a1',
					totalBenefit: 1,
					totalCost: 0,
					optimizationScore: 1,
					rank: 1
				}
			]
		});

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected page data');
		expect(result.readiness).toEqual({ isReady: true, issues: [] });
		expect(mockGetLatestRun).toHaveBeenCalledOnce();
		expect(result.run).toMatchObject({ id: 'run-1', name: 'Perhitungan Test' });
		expect(result.alternatives).toEqual([{ id: 'a1', code: 'A1', name: 'Snapshot Alternative' }]);
		expect(result.criteria).toEqual([
			{
				id: 'c1',
				code: 'C1',
				name: 'Snapshot Criterion',
				unit: 'poin',
				type: 'benefit',
				weight: 1,
				denominator: 10
			}
		]);
		expect(result.matrixRows).toEqual([
			{
				alternativeId: 'a1',
				raw: [10],
				labels: [null],
				normalized: [1],
				weighted: [1]
			}
		]);
		expect(result.results).toEqual([
			{
				alternativeId: 'a1',
				totalBenefit: 1,
				totalCost: 0,
				optimizationScore: 1,
				rank: 1
			}
		]);
	});
});

describe('MOORA calculation action', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('rejects an invalid session', async () => {
		const result = await actions.calculate!(actionEvent(null));

		expect(result).toMatchObject({ status: 401, data: { message: 'Sesi tidak valid' } });
		expect(mockCreateMooraCalculation).not.toHaveBeenCalled();
	});

	it('returns validation issues without hiding them', async () => {
		mockCreateMooraCalculation.mockResolvedValue({
			success: false,
			issues: ['Decision matrix belum lengkap']
		});

		const result = await actions.calculate!(actionEvent('admin-1'));

		expect(result).toMatchObject({
			status: 400,
			data: {
				message: 'Data belum siap untuk dihitung',
				issues: ['Decision matrix belum lengkap']
			}
		});
	});

	it('returns the persisted run id', async () => {
		mockCreateMooraCalculation.mockResolvedValue({ success: true, runId: 'run-1' });

		const result = await actions.calculate!(actionEvent('admin-1'));

		expect(mockCreateMooraCalculation).toHaveBeenCalledWith('admin-1');
		expect(result).toEqual({
			success: true,
			runId: 'run-1',
			message: 'Perhitungan MOORA berhasil disimpan'
		});
	});

	it('returns a generic database error', async () => {
		mockCreateMooraCalculation.mockRejectedValue(new Error('sensitive database details'));

		const result = await actions.calculate!(actionEvent('admin-1'));

		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Gagal menjalankan perhitungan MOORA' }
		});
		expect(JSON.stringify(result)).not.toContain('sensitive database details');
	});
});
