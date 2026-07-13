import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server.js';

const { mockSelect, mockDelete, mockDeleteWhere } = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn()
}));

vi.mock('$lib/server/db', () => ({ db: { select: mockSelect, delete: mockDelete } }));

const alternativeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const criterionId = '11111111-1111-4111-8111-111111111111';

function activeQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function orderedQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function alternativeQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function clearRequest(id: string) {
	const body = new FormData();
	body.set('alternativeId', id);

	return {
		request: new Request('http://localhost/admin/alternative-values?/clear', {
			method: 'POST',
			body
		})
	} as Parameters<NonNullable<typeof actions.clear>>[0];
}

function setup(rawValue: string, hasScale = true) {
	mockSelect
		.mockReturnValueOnce(activeQuery([{ id: alternativeId, code: 'A1', name: 'Alternative Test' }]))
		.mockReturnValueOnce(
			activeQuery([
				{
					id: criterionId,
					code: 'C1',
					name: 'Skala Test',
					type: 'benefit',
					inputType: 'scale',
					normalizedWeight: '1.000000000'
				}
			])
		)
		.mockReturnValueOnce(
			orderedQuery(hasScale ? [{ criterionId, label: 'Cukup', value: '3.0000' }] : [])
		)
		.mockReturnValueOnce(
			rowsQuery([{ alternativeId, criterionId, rawValue, labelValue: 'Cukup' }])
		);
}

describe('alternative values overview scale readiness', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
	});

	it('does not count an orphan scale value as filled', async () => {
		setup('4.0000');

		const result = await load();

		expect(result.summary.filledCellCount).toBe(0);
		expect(result.completeness.alternatives[0].missingCriteria[0]).toMatchObject({
			code: 'C1',
			reason: 'invalid_scale'
		});
	});

	it('counts a scale value that still matches an option', async () => {
		setup('3.0000');

		const result = await load();

		expect(result.summary.filledCellCount).toBe(1);
		expect(result.completeness.isComplete).toBe(true);
	});

	it('reports a value as invalid when its scale is inactive', async () => {
		setup('3.0000', false);

		const result = await load();

		expect(result.summary.filledCellCount).toBe(0);
		expect(result.emptyScaleCriteria).toHaveLength(1);
		expect(result.completeness.alternatives[0].missingCriteria[0].reason).toBe('invalid_scale');
	});
});

describe('clear alternative values action', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
	});

	it('rejects an invalid alternative ID', async () => {
		const result = await actions.clear!(clearRequest('invalid'));

		expect(result).toMatchObject({ status: 400, data: { message: 'Alternatif tidak valid' } });
		expect(mockSelect).not.toHaveBeenCalled();
	});

	it('returns not found when the alternative no longer exists', async () => {
		mockSelect.mockReturnValue(alternativeQuery([]));

		const result = await actions.clear!(clearRequest(alternativeId));

		expect(result).toMatchObject({ status: 404, data: { message: 'Alternatif tidak ditemukan' } });
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes every value owned by the alternative', async () => {
		mockSelect.mockReturnValue(alternativeQuery([{ id: alternativeId }]));

		const result = await actions.clear!(clearRequest(alternativeId));

		expect(result).toEqual({ message: 'Nilai alternatif berhasil dibersihkan' });
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
	});

	it('returns a safe message when the database fails', async () => {
		mockSelect.mockImplementation(() => {
			throw new Error('database details');
		});

		const result = await actions.clear!(clearRequest(alternativeId));

		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Gagal membersihkan nilai alternatif' }
		});
	});
});
