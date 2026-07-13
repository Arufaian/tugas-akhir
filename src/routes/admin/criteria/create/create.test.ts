import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server.js';

interface ActionResult {
	status?: number;
	data?: { form: { message?: { type: string; text: string } } };
}

const { mockFrom, mockInsertValues } = vi.hoisted(() => ({
	mockFrom: vi.fn(),
	mockInsertValues: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: () => ({ from: mockFrom }),
		insert: () => ({ values: mockInsertValues })
	}
}));

function post(overrides: Record<string, string> = {}) {
	const fd = new FormData();
	fd.append('name', 'Test');
	fd.append('unit', 'skor');
	for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
	return {
		request: new Request('http://localhost', { method: 'POST', body: fd })
	} as unknown as Parameters<typeof actions.default>[0];
}

describe('create criterion code generation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('generates C1 orderIndex 1 when table empty', async () => {
		mockFrom.mockResolvedValue([{ maxCodeNum: 0, maxOrder: 0 }]);
		await actions.default(post());
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ code: 'C1', orderIndex: 1 })
		);
	});

	it('increments code and order after existing rows', async () => {
		mockFrom.mockResolvedValue([{ maxCodeNum: 5, maxOrder: 5 }]);
		await actions.default(post());
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ code: 'C6', orderIndex: 6 })
		);
	});

	it('handles double-digit codes correctly (C10 after C9)', async () => {
		mockFrom.mockResolvedValue([{ maxCodeNum: 9, maxOrder: 9 }]);
		await actions.default(post());
		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ code: 'C10' }));
	});

	it('returns 409 when a tech features criterion already exists', async () => {
		mockFrom.mockResolvedValue([{ maxCodeNum: 1, maxOrder: 1 }]);
		mockInsertValues.mockRejectedValue(
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
});
