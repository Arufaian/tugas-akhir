import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, PATCH } from './+server.js';

const {
	mockTransaction,
	mockSelect,
	mockFor,
	mockDelete,
	mockDeleteWhere,
	mockUpdate,
	mockSet,
	mockUpdateWhere,
	mockReturning
} = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn(),
	mockUpdate: vi.fn(),
	mockSet: vi.fn(),
	mockUpdateWhere: vi.fn(),
	mockReturning: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction, select: mockSelect, update: mockUpdate }
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

function patchRequest(isActive: unknown, id = criterionId) {
	return {
		params: { id },
		request: new Request('http://localhost/admin/criteria/' + id, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ isActive })
		})
	} as Parameters<typeof PATCH>[0];
}

function useTransaction(
	criterionRows: unknown[],
	valueRows: unknown[] = [],
	calculationRows: unknown[] = []
) {
	mockSelect
		.mockReturnValueOnce(criterionQuery(criterionRows))
		.mockReturnValueOnce(valueQuery(valueRows))
		.mockReturnValueOnce(valueQuery(calculationRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, delete: mockDelete })
	);
}

describe('criterion status', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockUpdateWhere });
		mockUpdateWhere.mockReturnValue({ returning: mockReturning });
	});

	it('returns 400 for an invalid UUID or status', async () => {
		expect((await PATCH(patchRequest(true, 'invalid-id'))).status).toBe(400);
		expect((await PATCH(patchRequest('false'))).status).toBe(400);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it.each([false, true])('sets isActive to %s', async (isActive) => {
		mockSelect.mockReturnValueOnce(valueQuery([{ id: criterionId, isPrice: false }]));
		mockReturning.mockResolvedValue([{ id: criterionId }]);

		const response = await PATCH(patchRequest(isActive));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, isActive });
		expect(mockSet).toHaveBeenCalledWith({ isActive, updatedAt: expect.any(Date) });
	});

	it('returns 404 when the criterion does not exist', async () => {
		mockSelect.mockReturnValueOnce(valueQuery([]));

		const response = await PATCH(patchRequest(false));

		expect(response.status).toBe(404);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('returns 409 when deactivating the price criterion', async () => {
		mockSelect.mockReturnValueOnce(valueQuery([{ id: criterionId, isPrice: true }]));

		const response = await PATCH(patchRequest(false));

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Lepaskan penanda filter harga terlebih dahulu'
		});
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('returns a generic 500 response when the database fails', async () => {
		mockSelect.mockReturnValueOnce(valueQuery([{ id: criterionId, isPrice: false }]));
		mockReturning.mockRejectedValue(new Error('sensitive database error'));

		const response = await PATCH(patchRequest(false));

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ message: 'Gagal mengubah status kriteria' });
	});

	it('maps a concurrent price invariant conflict to 409', async () => {
		mockSelect.mockReturnValueOnce(valueQuery([{ id: criterionId, isPrice: false }]));
		mockReturning.mockRejectedValue(
			Object.assign(new Error('check violation'), {
				code: '23514',
				constraint_name: 'criteria_price_invariants'
			})
		);

		const response = await PATCH(patchRequest(false));

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Lepaskan penanda filter harga terlebih dahulu'
		});
	});
});

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
		useTransaction([{ id: criterionId, isPrice: false }], [{ id: 'value-id' }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Kriteria sudah digunakan pada nilai alternatif'
		});
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('returns 409 when the criterion has calculation history', async () => {
		useTransaction([{ id: criterionId, isPrice: false }], [], [{ id: 'calculation-id' }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Kriteria sudah digunakan pada histori perhitungan'
		});
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes an unused criterion inside the transaction', async () => {
		useTransaction([{ id: criterionId, isPrice: false }]);

		const response = await DELETE(request());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
	});

	it('returns 409 when deleting the price criterion', async () => {
		useTransaction([{ id: criterionId, isPrice: true }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Lepaskan penanda filter harga sebelum menghapus kriteria'
		});
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('returns a generic 500 response when the database fails', async () => {
		mockTransaction.mockRejectedValue(new Error('sensitive database error'));

		const response = await DELETE(request());

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ message: 'Gagal menghapus kriteria' });
	});
});
