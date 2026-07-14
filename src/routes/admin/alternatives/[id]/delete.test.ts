import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE } from './+server.js';

const {
	mockTransaction,
	mockSelect,
	mockFor,
	mockDelete,
	mockDeleteWhere,
	mockStorageFrom,
	mockStorageRemove
} = vi.hoisted(() => ({
	mockTransaction: vi.fn(),
	mockSelect: vi.fn(),
	mockFor: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageRemove: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { transaction: mockTransaction }
}));

const alternativeId = '11111111-1111-4111-8111-111111111111';

function alternativeQuery(rows: unknown[]) {
	mockFor.mockReturnValue({ limit: async () => rows });
	return { from: () => ({ where: () => ({ for: mockFor }) }) };
}

function dependencyQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function request(id = alternativeId) {
	return {
		params: { id },
		locals: {
			supabase: { storage: { from: mockStorageFrom } }
		}
	} as unknown as Parameters<typeof DELETE>[0];
}

function useTransaction(
	alternativeRows: unknown[],
	valueRows: unknown[] = [],
	calculationRows: unknown[] = []
) {
	mockSelect
		.mockReturnValueOnce(alternativeQuery(alternativeRows))
		.mockReturnValueOnce(dependencyQuery(valueRows))
		.mockReturnValueOnce(dependencyQuery(calculationRows));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: mockSelect, delete: mockDelete })
	);
}

describe('alternative delete guard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
		mockStorageFrom.mockReturnValue({ remove: mockStorageRemove });
		mockStorageRemove.mockResolvedValue({ data: [], error: null });
	});

	it('returns 400 for an invalid UUID without starting a transaction', async () => {
		const response = await DELETE(request('invalid-id'));

		expect(response.status).toBe(400);
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('returns 404 when the alternative does not exist', async () => {
		useTransaction([]);

		const response = await DELETE(request());

		expect(response.status).toBe(404);
		expect(mockFor).toHaveBeenCalledWith('update');
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});

	it('returns 409 when the alternative has criterion values', async () => {
		useTransaction([{ id: alternativeId, img: null }], [{ id: 'value-id' }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Alternatif sudah digunakan pada nilai kriteria'
		});
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});

	it('returns 409 when the alternative has calculation history', async () => {
		useTransaction([{ id: alternativeId, img: null }], [], [{ id: 'calculation-id' }]);

		const response = await DELETE(request());

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: 'Alternatif sudah digunakan pada histori perhitungan'
		});
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});

	it('deletes an unused alternative before cleaning up its image', async () => {
		useTransaction([
			{
				id: alternativeId,
				img: { url: 'https://example.com/image.webp', path: 'alternatives/image.webp' }
			}
		]);

		const response = await DELETE(request());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(mockStorageFrom).toHaveBeenCalledWith('tugas-akhir');
		expect(mockStorageRemove).toHaveBeenCalledWith(['alternatives/image.webp']);
		expect(mockDeleteWhere.mock.invocationCallOrder[0]).toBeLessThan(
			mockStorageRemove.mock.invocationCallOrder[0]
		);
	});

	it('does not clean up Storage when the database fails', async () => {
		mockTransaction.mockRejectedValue(new Error('sensitive database error'));

		const response = await DELETE(request());

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ message: 'Gagal menghapus alternatif' });
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});
});
