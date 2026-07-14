import { describe, expect, it } from 'vitest';

import { load as loadHistory } from './+page.server.js';
import { load as loadDetail } from './[id]/+page.server.js';

describe('calculation history mock routes', () => {
	it('returns the second page with correct pagination metadata', async () => {
		const result = await loadHistory({
			url: new URL('https://example.com/admin/calculation-history?page=2')
		} as Parameters<typeof loadHistory>[0]);

		expect(result.pagination).toEqual({
			page: 2,
			pageSize: 10,
			totalItems: 12,
			totalPages: 2
		});
		expect(result.runs).toHaveLength(2);
	});

	it('returns 404 for a valid UUID that is not in the fixture', () => {
		expect(() =>
			loadDetail({
				params: { id: '00000000-0000-4000-8000-999999999999' }
			} as Parameters<typeof loadDetail>[0])
		).toThrow();
	});
});
