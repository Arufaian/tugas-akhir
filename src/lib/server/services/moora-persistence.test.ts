import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMooraCalculation } from './moora-persistence.js';

const {
	mockTransaction,
	txSelect,
	txInsert,
	runInsertValues,
	runReturning,
	resultInsertValues,
	detailInsertValues
} = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	txSelect: vi.fn(),
	txInsert: vi.fn(),
	runInsertValues: vi.fn(),
	runReturning: vi.fn(),
	resultInsertValues: vi.fn(),
	detailInsertValues: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction }
}));

const runId = '99999999-9999-4999-8999-999999999999';
const createdBy = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const alternatives = [{ id: 'a1', code: 'A1', name: 'Alternative 1' }];
const criteria = [
	{
		id: 'c1',
		code: 'C1',
		name: 'Kualitas',
		unit: 'poin',
		orderIndex: 1,
		type: 'benefit' as const,
		inputType: 'number' as const,
		normalizedWeight: '1.000000000'
	}
];
const values = [
	{
		alternativeId: 'a1',
		criterionId: 'c1',
		rawValue: '10.0000',
		labelValue: null
	}
];

function orderedQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function filteredQuery(rows: unknown[]) {
	return { from: () => ({ where: async () => rows }) };
}

function useTransaction({ alternativeRows = alternatives }: { alternativeRows?: unknown[] } = {}) {
	txSelect
		.mockReturnValueOnce(orderedQuery(alternativeRows))
		.mockReturnValueOnce(orderedQuery(criteria))
		.mockReturnValueOnce(rowsQuery(values))
		.mockReturnValueOnce(filteredQuery([]));
	txInsert
		.mockReturnValueOnce({ values: runInsertValues })
		.mockReturnValueOnce({ values: resultInsertValues })
		.mockReturnValueOnce({ values: detailInsertValues });
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: txSelect, insert: txInsert })
	);
}

describe('createMooraCalculation', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-14T08:00:00.000Z'));
		runInsertValues.mockReturnValue({ returning: runReturning });
		runReturning.mockResolvedValue([{ id: runId }]);
		resultInsertValues.mockResolvedValue(undefined);
		detailInsertValues.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('persists one run with bulk results and details in repeatable read', async () => {
		useTransaction();

		const result = await createMooraCalculation(createdBy);

		expect(result).toEqual({ success: true, runId });
		expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: 'repeatable read',
			accessMode: 'read write'
		});
		expect(txSelect).toHaveBeenCalledTimes(4);
		expect(runInsertValues).toHaveBeenCalledWith({
			runName: 'Perhitungan 2026-07-14T08:00:00.000Z',
			createdBy,
			criteriaCount: 1,
			alternativeCount: 1,
			createdAt: new Date('2026-07-14T08:00:00.000Z')
		});
		expect(resultInsertValues).toHaveBeenCalledOnce();
		expect(resultInsertValues).toHaveBeenCalledWith([
			{
				calculationRunId: runId,
				alternativeId: 'a1',
				alternativeCode: 'A1',
				alternativeName: 'Alternative 1',
				totalBenefit: '1.000000000',
				totalCost: '0.000000000',
				optimizationScore: '1.000000000',
				rank: 1
			}
		]);
		expect(detailInsertValues).toHaveBeenCalledOnce();
		expect(detailInsertValues).toHaveBeenCalledWith([
			{
				calculationRunId: runId,
				alternativeId: 'a1',
				criterionId: 'c1',
				criterionCode: 'C1',
				criterionName: 'Kualitas',
				criterionUnit: 'poin',
				criterionOrderIndex: 1,
				criterionType: 'benefit',
				criterionInputType: 'number',
				rawValue: '10',
				labelValue: null,
				denominator: '10.000000000',
				normalizedValue: '1.000000000',
				weight: '1.000000000',
				weightedValue: '1.000000000'
			}
		]);
	});

	it('returns validation issues without inserting rows', async () => {
		useTransaction({ alternativeRows: [] });

		const result = await createMooraCalculation(createdBy);

		expect(result).toEqual({ success: false, issues: ['Belum ada alternative aktif'] });
		expect(txInsert).not.toHaveBeenCalled();
	});

	it('propagates a result insert failure before inserting details', async () => {
		useTransaction();
		resultInsertValues.mockRejectedValue(new Error('result insert failed'));

		await expect(createMooraCalculation(createdBy)).rejects.toThrow('result insert failed');
		expect(detailInsertValues).not.toHaveBeenCalled();
	});

	it('propagates a detail insert failure', async () => {
		useTransaction();
		detailInsertValues.mockRejectedValue(new Error('detail insert failed'));

		await expect(createMooraCalculation(createdBy)).rejects.toThrow('detail insert failed');
		expect(resultInsertValues).toHaveBeenCalledOnce();
		expect(detailInsertValues).toHaveBeenCalledOnce();
	});
});
