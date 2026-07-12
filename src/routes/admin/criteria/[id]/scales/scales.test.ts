import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions } from './+page.server.js';

const {
	mockTransaction,
	mockSelect,
	mockFor,
	mockDelete,
	mockDeleteWhere,
	mockUpdate,
	mockUpdateSet,
	mockUpdateWhere
} = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn(),
	mockUpdate: vi.fn(),
	mockUpdateSet: vi.fn(),
	mockUpdateWhere: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction }
}));

const criterionId = '11111111-1111-4111-8111-111111111111';
const scaleId = '22222222-2222-4222-8222-222222222222';

interface ActionResult {
	status?: number;
	data?: { form: { message?: { type: string; text: string } } };
	form?: { message?: { type: string; text: string } };
}

function scaleQuery(rows: unknown[]) {
	mockFor.mockReturnValue({ limit: async () => rows });
	return { from: () => ({ where: () => ({ for: mockFor }) }) };
}

function valueQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function post(id = criterionId, submittedScaleId = scaleId) {
	const body = new FormData();
	if (submittedScaleId) body.set('scaleId', submittedScaleId);

	return {
		params: { id },
		request: new Request(`http://localhost/admin/criteria/${id}/scales`, {
			method: 'POST',
			body
		})
	} as unknown as Parameters<typeof actions.delete>[0];
}

function updatePost(value: string, label = 'Diperbarui') {
	const body = new FormData();
	body.set('scaleId', scaleId);
	body.set('label', label);
	body.set('value', value);
	body.set('description', 'Deskripsi baru');

	return {
		params: { id: criterionId },
		request: new Request(`http://localhost/admin/criteria/${criterionId}/scales`, {
			method: 'POST',
			body
		})
	} as unknown as Parameters<typeof actions.update>[0];
}

function useTransaction(scaleRows: unknown[], valueRows: unknown[] = []) {
	mockSelect.mockReturnValueOnce(scaleQuery(scaleRows)).mockReturnValueOnce(valueQuery(valueRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, delete: mockDelete })
	);
}

function useUpdateTransaction(scaleRows: unknown[], valueRows?: unknown[]) {
	mockSelect.mockReturnValueOnce(scaleQuery(scaleRows));
	if (valueRows) mockSelect.mockReturnValueOnce(valueQuery(valueRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, update: mockUpdate })
	);
}

describe('delete criterion scale guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
	});

	it('returns 400 for an invalid delete form', async () => {
		const result = (await actions.delete(post(criterionId, ''))) as ActionResult;

		expect(result.status).toBe(400);
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('returns 404 for an invalid criterion UUID', async () => {
		const result = (await actions.delete(post('invalid-id'))) as ActionResult;

		expect(result.status).toBe(404);
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('returns 404 when the scale does not exist', async () => {
		useTransaction([]);

		const result = (await actions.delete(post())) as ActionResult;

		expect(result.status).toBe(404);
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('returns 409 when the scale is used by an alternative value', async () => {
		useTransaction([{ criterionId, value: '3.0000' }], [{ id: 'value-id' }]);

		const result = (await actions.delete(post())) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message).toEqual({
			type: 'error',
			text: 'Skala sudah digunakan pada nilai alternatif'
		});
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes an unused scale inside the transaction', async () => {
		useTransaction([{ criterionId, value: '3.0000' }]);

		const result = (await actions.delete(post())) as ActionResult;

		expect(result.form?.message).toEqual({ type: 'success', text: 'Skala berhasil dihapus' });
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
	});

	it('returns a generic 500 response when the database fails', async () => {
		mockTransaction.mockRejectedValue(new Error('sensitive database error'));

		const result = (await actions.delete(post())) as ActionResult;

		expect(result.status).toBe(500);
		expect(result.data?.form.message).toEqual({
			type: 'error',
			text: 'Gagal menghapus skala'
		});
	});
});

describe('update criterion scale guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
		mockUpdate.mockReturnValue({ set: mockUpdateSet });
	});

	it('returns 404 when the scale does not exist', async () => {
		useUpdateTransaction([]);

		const result = (await actions.update(updatePost('4'))) as ActionResult;

		expect(result.status).toBe(404);
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('returns 409 when changing a value that is already used', async () => {
		useUpdateTransaction([{ criterionId, value: '3.0000' }], [{ id: 'value-id' }]);

		const result = (await actions.update(updatePost('4'))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message).toEqual({
			type: 'error',
			text: 'Nilai skala tidak dapat diubah karena sudah digunakan'
		});
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('allows label changes when the numeric value is equivalent', async () => {
		useUpdateTransaction([{ criterionId, value: '3.0000' }]);

		const result = (await actions.update(updatePost('3', 'Label baru'))) as ActionResult;

		expect(result.form?.message).toEqual({ type: 'success', text: 'Skala berhasil diperbarui' });
		expect(mockSelect).toHaveBeenCalledOnce();
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ label: 'Label baru', value: '3' })
		);
	});

	it('allows changing the value when the scale is unused', async () => {
		useUpdateTransaction([{ criterionId, value: '3.0000' }], []);

		const result = (await actions.update(updatePost('4'))) as ActionResult;

		expect(result.form?.message).toEqual({ type: 'success', text: 'Skala berhasil diperbarui' });
		expect(mockUpdateWhere).toHaveBeenCalledOnce();
	});
});
