import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions } from './+page.server.js';

const { mockTransaction, mockSelect, mockFor, mockUpdate, mockSet, mockUpdateWhere } = vi.hoisted(
	() => ({
		mockTransaction: vi.fn(),
		mockSelect: vi.fn(),
		mockFor: vi.fn(),
		mockUpdate: vi.fn(),
		mockSet: vi.fn(),
		mockUpdateWhere: vi.fn()
	})
);

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

function post({
	inputType = 'number',
	type = 'benefit',
	unit = 'skor',
	isPrice = false
}: {
	inputType?: 'number' | 'scale' | 'tech_features';
	type?: 'benefit' | 'cost';
	unit?: string;
	isPrice?: boolean;
} = {}) {
	const form = new FormData();
	form.set('name', 'Kriteria');
	form.set('unit', unit);
	form.set('inputType', inputType);
	form.set('type', type);
	form.set('isPrice', String(isPrice));

	return {
		params: { id: '11111111-1111-4111-8111-111111111111' },
		request: new Request('http://localhost', { method: 'POST', body: form })
	} as Parameters<typeof actions.default>[0];
}

describe('criterion input type guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockUpdateWhere });
		mockTransaction.mockImplementation(async (callback) =>
			callback({ select: mockSelect, update: mockUpdate })
		);
	});

	it('returns 409 when changing a criterion that has alternative values', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number' }]))
			.mockReturnValueOnce(query([{ id: 'value-id' }]));

		const result = (await actions.default(post({ inputType: 'scale' }))) as ActionResult;

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

		const result = (await actions.default(post())) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Tipe input tidak dapat diubah selama skala aktif masih tersedia'
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('allows updates when the input type does not change', async () => {
		mockSelect.mockReturnValueOnce(lockedQuery([{ inputType: 'number' }]));

		const result = (await actions.default(post())) as ActionResult;

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

		const result = (await actions.default(post({ inputType: 'tech_features' }))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message).toEqual({
			type: 'error',
			text: 'Kriteria fitur teknologi hanya boleh ada satu'
		});
	});

	it('allows clearing the price marker', async () => {
		mockSelect.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: true }]));

		const result = (await actions.default(
			post({ type: 'cost', unit: 'Rp', isPrice: false })
		)) as ActionResult;

		expect(result.form?.message?.type).toBe('success');
		expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ isPrice: false }));
	});

	it('marks an eligible criterion as the price source', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: true }]))
			.mockReturnValueOnce(query([]));

		const result = (await actions.default(
			post({ type: 'cost', unit: 'Rp', isPrice: true })
		)) as ActionResult;

		expect(result.form?.message?.type).toBe('success');
		expect(mockSet).toHaveBeenCalledWith(
			expect.objectContaining({ isPrice: true, type: 'cost', inputType: 'number', unit: 'Rp' })
		);
	});

	it('rejects an inactive price criterion', async () => {
		mockSelect.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: false }]));

		const result = (await actions.default(
			post({ type: 'cost', unit: 'Rp', isPrice: true })
		)) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Aktifkan kriteria sebelum menjadikannya filter harga'
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it.each([
		{ type: 'benefit' as const, unit: 'Rp', inputType: 'number' as const },
		{ type: 'cost' as const, unit: 'juta rupiah', inputType: 'number' as const },
		{ type: 'cost' as const, unit: 'Rp', inputType: 'scale' as const }
	])('rejects an invalid price criterion shape', async ({ type, unit, inputType }) => {
		mockSelect.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: true }]));

		const result = (await actions.default(
			post({ type, unit, inputType, isPrice: true })
		)) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Filter harga harus menggunakan tipe cost, input angka, dan unit Rp'
		);
	});

	it('rejects a second price criterion', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: true }]))
			.mockReturnValueOnce(query([{ id: 'existing-price-id' }]));

		const result = (await actions.default(
			post({ type: 'cost', unit: 'Rp', isPrice: true })
		)) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe('Kriteria harga sudah ditetapkan');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('maps a concurrent price marker conflict to 409', async () => {
		mockSelect
			.mockReturnValueOnce(lockedQuery([{ inputType: 'number', isActive: true }]))
			.mockReturnValueOnce(query([]));
		mockUpdateWhere.mockRejectedValue(
			Object.assign(new Error('duplicate key'), {
				code: '23505',
				constraint_name: 'uq_criteria_single_price'
			})
		);

		const result = (await actions.default(
			post({ type: 'cost', unit: 'Rp', isPrice: true })
		)) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe('Kriteria harga sudah ditetapkan');
	});
});
