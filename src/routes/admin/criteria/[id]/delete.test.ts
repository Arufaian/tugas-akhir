import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE } from './+server.js';

const { mockTransaction, mockSelect, mockFor, mockDelete, mockDeleteWhere } = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction }
}));

const criterionId = '11111111-1111-4111-8111-111111111111';

function criterionQuery(rows: unknown[]) {
	mockFor.mockReturnValue({ limit: async () => rows });
	return { from: () => ({ where: () => ({ for: mockFor }) }) };
}

function valueQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function request(id = criterionId) {
	return { params: { id } } as Parameters<typeof DELETE>[0];
}

function useTransaction(criterionRows: unknown[], valueRows: unknown[] = []) {
	mockSelect
		.mockReturnValueOnce(criterionQuery(criterionRows))
		.mockReturnValueOnce(valueQuery(valueRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, delete: mockDelete })
	);
}

describe('delete criterion guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
	});

	it('returns 400 for an invalid UUID without starting a transaction', async () => {
		const response = await DELETE(request('invalid-id'));

		expect(response.status).toBe(400);
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('returns 404 when the criterion does not exist', async () => {
		useTransaction([]);

		const response = await DELETE(request());

		expect(response.status).toBe(404);
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('returns 409 when the criterion has alternative values', async () => {
		useTransaction([{ id: criterionId }], [{ id: 'value-id' }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Kriteria sudah digunakan pada nilai alternatif'
		});
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes an unused criterion inside the transaction', async () => {
		useTransaction([{ id: criterionId }]);

		const response = await DELETE(request());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
	});

	it('returns a generic 500 response when the database fails', async () => {
		mockTransaction.mockRejectedValue(new Error('sensitive database error'));

		const response = await DELETE(request());

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ message: 'Gagal menghapus kriteria' });
	});
});
