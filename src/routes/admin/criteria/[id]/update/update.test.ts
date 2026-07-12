import { expect, it, vi } from 'vitest';

import { actions } from './+page.server.js';

const { mockWhere } = vi.hoisted(() => ({ mockWhere: vi.fn() }));

vi.mock('$lib/server/db/index.js', () => ({
	db: { update: () => ({ set: () => ({ where: mockWhere }) }) }
}));

interface ActionResult {
	status?: number;
	data?: { form: { message?: { type: string; text: string } } };
}

it('returns 409 when changing a second criterion to tech features', async () => {
	mockWhere.mockRejectedValue(
		Object.assign(new Error('duplicate key'), {
			code: '23505',
			constraint_name: 'uq_criteria_single_tech_features'
		})
	);
	const form = new FormData();
	form.set('name', 'Fitur Teknologi');
	form.set('unit', 'skor');
	form.set('inputType', 'tech_features');

	const result = (await actions.default({
		params: { id: '11111111-1111-4111-8111-111111111111' },
		request: new Request('http://localhost', { method: 'POST', body: form })
	} as Parameters<typeof actions.default>[0])) as ActionResult;

	expect(result.status).toBe(409);
	expect(result.data?.form.message).toEqual({
		type: 'error',
		text: 'Kriteria fitur teknologi hanya boleh ada satu'
	});
});
