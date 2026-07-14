import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions } from './+page.server.js';

const {
	mockSelect,
	mockSelectLimit,
	mockUpdate,
	mockSet,
	mockUpdateWhere,
	mockStorageFrom,
	mockStorageRemove
} = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockSelectLimit: vi.fn(),
	mockUpdate: vi.fn(),
	mockSet: vi.fn(),
	mockUpdateWhere: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageRemove: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { select: mockSelect, update: mockUpdate }
}));

const alternativeId = '11111111-1111-4111-8111-111111111111';

function formData(image: { url: string; path: string } | null) {
	const data = new FormData();
	data.set('name', 'Alternative Test');
	data.set('category', 'Classy');
	data.set('img', image ? JSON.stringify(image) : '');
	return data;
}

function event(image: { url: string; path: string } | null) {
	return {
		params: { id: alternativeId },
		request: new Request(`http://localhost/admin/alternatives/${alternativeId}/update`, {
			method: 'POST',
			body: formData(image)
		}),
		locals: {
			supabase: { storage: { from: mockStorageFrom } }
		}
	} as unknown as Parameters<NonNullable<typeof actions.default>>[0];
}

describe('update alternative image cleanup', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockSelect.mockReturnValue({
			from: () => ({ where: () => ({ limit: mockSelectLimit }) })
		});
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockUpdateWhere });
		mockStorageFrom.mockReturnValue({ remove: mockStorageRemove });
		mockUpdateWhere.mockResolvedValue(undefined);
		mockStorageRemove.mockResolvedValue({ data: [], error: null });
	});

	it('removes the previous image only after the database update succeeds', async () => {
		mockSelectLimit.mockResolvedValue([
			{ img: { url: 'https://example.com/old.png', path: 'alternative-image/old.png' } }
		]);

		const result = await actions.default!(
			event({ url: 'https://example.com/new.png', path: 'alternative-image/new.png' })
		);

		expect(result).toMatchObject({ form: { message: { type: 'success' } } });
		expect(mockStorageRemove).toHaveBeenCalledWith(['alternative-image/old.png']);
		expect(mockUpdateWhere.mock.invocationCallOrder[0]).toBeLessThan(
			mockStorageRemove.mock.invocationCallOrder[0]
		);
	});

	it('keeps the previous image when the database update fails', async () => {
		mockSelectLimit.mockResolvedValue([
			{ img: { url: 'https://example.com/old.png', path: 'alternative-image/old.png' } }
		]);
		mockUpdateWhere.mockRejectedValue(new Error('database failed'));

		const result = await actions.default!(event(null));

		expect(result).toMatchObject({
			status: 500,
			data: { form: { message: { type: 'error' } } }
		});
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});
});
