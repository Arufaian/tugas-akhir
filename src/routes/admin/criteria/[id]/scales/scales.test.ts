import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server.js';

const {
	mockTransaction,
	mockSelect,
	mockFor,
	mockDelete,
	mockDeleteWhere,
	mockUpdate,
	mockUpdateSet,
	mockUpdateWhere,
	mockInsert
} = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn(),
	mockUpdate: vi.fn(),
	mockUpdateSet: vi.fn(),
	mockUpdateWhere: vi.fn(),
	mockInsert: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction, select: mockSelect }
}));

const criterionId = '11111111-1111-4111-8111-111111111111';
const scaleId = '22222222-2222-4222-8222-222222222222';

interface ActionResult {
	status?: number;
	data?: {
		form: { message?: { type: string; text: string } };
		message?: string;
	};
	form?: { message?: { type: string; text: string } };
	success?: boolean;
	isActive?: boolean;
}

function scaleQuery(rows: unknown[]) {
	return {
		from: () => ({
			where: () => ({
				for: (lock: string) => {
					mockFor(lock);
					return { limit: async () => rows };
				}
			})
		})
	};
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

function createPost() {
	const body = new FormData();
	body.set('label', 'Baik');
	body.set('value', '4');

	return {
		params: { id: criterionId },
		request: new Request(`http://localhost/admin/criteria/${criterionId}/scales`, {
			method: 'POST',
			body
		})
	} as Parameters<typeof actions.create>[0];
}

function statusPost(isActive: unknown, id = criterionId, submittedScaleId = scaleId) {
	const body = new FormData();
	body.set('scaleId', String(submittedScaleId));
	body.set('isActive', String(isActive));

	return {
		params: { id },
		request: new Request(`http://localhost/admin/criteria/${id}/scales`, {
			method: 'POST',
			body
		})
	} as Parameters<typeof actions.status>[0];
}

function useTransaction(scaleRows: unknown[], valueRows: unknown[] = []) {
	mockSelect
		.mockReturnValueOnce(scaleQuery([{ inputType: 'scale' }]))
		.mockReturnValueOnce(scaleQuery(scaleRows))
		.mockReturnValueOnce(valueQuery(valueRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, delete: mockDelete, insert: mockInsert })
	);
}

function useUpdateTransaction(scaleRows: unknown[], valueRows?: unknown[]) {
	mockSelect
		.mockReturnValueOnce(scaleQuery([{ inputType: 'scale' }]))
		.mockReturnValueOnce(scaleQuery(scaleRows));
	if (valueRows) mockSelect.mockReturnValueOnce(valueQuery(valueRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, update: mockUpdate })
	);
}

function useInvalidParent() {
	mockSelect.mockReturnValueOnce(scaleQuery([{ inputType: 'number' }]));
	mockTransaction.mockImplementation(async (callback) =>
		callback({
			select: mockSelect,
			update: mockUpdate,
			delete: mockDelete,
			insert: mockInsert
		})
	);
}

function useMissingParent() {
	mockSelect.mockReturnValueOnce(scaleQuery([]));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, update: mockUpdate })
	);
}

describe('criterion scale parent guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
		mockUpdate.mockReturnValue({ set: mockUpdateSet });
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
	});

	it('rejects loading scales for a non-scale criterion', async () => {
		mockSelect.mockReturnValueOnce(
			valueQuery([{ id: criterionId, name: 'Harga', inputType: 'number' }])
		);

		await expect(
			load({ params: { id: criterionId } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({
			status: 409,
			body: { message: 'Skala hanya dapat dikelola untuk kriteria bertipe skala' }
		});
	});

	it('rejects creating a scale for a non-scale criterion', async () => {
		useInvalidParent();

		const result = (await actions.create(createPost())) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Skala hanya dapat dikelola untuk kriteria bertipe skala'
		);
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it.each([
		['update', () => actions.update(updatePost('4'))],
		['delete', () => actions.delete(post())]
	])('rejects %s for a non-scale criterion', async (_name, run) => {
		useInvalidParent();

		const result = (await run()) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.form.message?.text).toBe(
			'Skala hanya dapat dikelola untuk kriteria bertipe skala'
		);
	});

	it('rejects status changes for a non-scale criterion', async () => {
		useInvalidParent();

		const result = (await actions.status(statusPost(false))) as ActionResult;

		expect(result.status).toBe(409);
		expect(result.data?.message).toBe('Skala hanya dapat dikelola untuk kriteria bertipe skala');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('distinguishes a missing parent from a missing scale', async () => {
		useMissingParent();

		const result = (await actions.status(statusPost(false))) as ActionResult;

		expect(result.status).toBe(404);
		expect(result.data?.message).toBe('Kriteria tidak ditemukan');
	});
});

describe('criterion scale status', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
		mockUpdate.mockReturnValue({ set: mockUpdateSet });
	});

	it('returns 400 for an invalid criterion, scale, or status', async () => {
		expect(((await actions.status(statusPost(true, 'invalid-id'))) as ActionResult).status).toBe(
			400
		);
		expect(
			((await actions.status(statusPost(true, criterionId, 'invalid-id'))) as ActionResult).status
		).toBe(400);
		expect(((await actions.status(statusPost('invalid'))) as ActionResult).status).toBe(400);
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('returns 404 when the scale does not belong to the criterion', async () => {
		useUpdateTransaction([]);

		const result = (await actions.status(statusPost(false))) as ActionResult;

		expect(result.status).toBe(404);
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it.each([false, true])('sets isActive to %s inside the locked transaction', async (isActive) => {
		useUpdateTransaction([{ id: scaleId }]);

		const result = (await actions.status(statusPost(isActive))) as ActionResult;

		expect(result).toEqual({ success: true, isActive });
		expect(mockUpdateSet).toHaveBeenCalledWith({ isActive, updatedAt: expect.any(Date) });
	});

	it('returns a generic 500 response when the database fails', async () => {
		mockTransaction.mockRejectedValue(new Error('sensitive database error'));

		const result = (await actions.status(statusPost(false))) as ActionResult;

		expect(result.status).toBe(500);
		expect(result.data?.message).toBe('Gagal mengubah status skala');
	});
});

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
		expect(mockSelect).toHaveBeenCalledTimes(2);
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
