import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions } from './+page.server.js';

const { mockTransaction, mockSelect, mockFor, mockUpdate, mockUpdateWhere } = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockUpdate: vi.fn(),
	mockUpdateWhere: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction }
}));

interface ActionResult {
	status?: number;
	data?: { form: { message?: { type: string; text: string } } };
	form?: { message?: { type: string; text: string } };
}

function lockedQuery(rows: unknown[]) {
	mockFor.mockReturnValue({ limit: async () => rows });
	return { from: () => ({ where: () => ({ for: mockFor }) }) };
}

function query(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function post(inputType: 'number' | 'scale' | 'tech_features') {
	const form = new FormData();
	form.set('name', 'Kriteria');
	form.set('unit', 'skor');
	form.set('inputType', inputType);

	return {
		params: { id: '11111111-1111-4111-8111-111111111111' },
		request: new Request('http://localhost', { method: 'POST', body: form })
	} as Parameters<typeof actions.default>[0];
}

describe('criterion input type guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdate.mockReturnValue({ set: () => ({ where: mockUpdateWhere }) });
		mockTransaction.mockImplementation(async (callback) =>
			callback({ select: mockSelect, update: mockUpdate })
		);
	});

	it('returns 409 when changing a criterion that has alternative values', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number' }]))
			.mockReturnValueOnce(query([{ id: 'value-id' }]));

		const result = (await actions.default(post('scale'))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Tipe input tidak dapat diubah karena kriteria sudah memiliki nilai alternatif'
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('returns 409 when leaving scale while an active scale exists', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'scale' }]))
			.mockReturnValueOnce(query([]))
			.mockReturnValueOnce(query([{ id: 'scale-id' }]));

		const result = (await actions.default(post('number'))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Tipe input tidak dapat diubah selama skala aktif masih tersedia'
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('allows updates when the input type does not change', async () => {
		mockSelect.mockReturnValueOnce(lockedQuery([{ inputType: 'number' }]));

		const result = (await actions.default(post('number'))) as ActionResult;

		expect(result.form?.message).toEqual({
			type: 'success',
			text: 'Kriteria berhasil diperbarui'
		});
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockUpdateWhere).toHaveBeenCalledOnce();
	});

	it('returns 409 when changing a second criterion to tech features', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number' }]))
			.mockReturnValueOnce(query([]));
		mockUpdateWhere.mockRejectedValue(
			Object.assign(new Error('duplicate key'), {
				code: '23505',
				constraint_name: 'uq_criteria_single_tech_features'
			})
		);

		const result = (await actions.default(post('tech_features'))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message).toEqual({
			type: 'error',
			text: 'Kriteria fitur teknologi hanya boleh ada satu'
		});
	});
});
