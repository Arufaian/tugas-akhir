import { beforeEach, describe, expect, it, vi } from 'vitest';

import { load as loadHistory } from './+page.server.js';
import { load as loadDetail } from './[id]/+page.server.js';

const { mockGetHistoryPage, mockGetRun } = vi.hoisted(() => ({
	mockGetHistoryPage: vi.fn(),
	mockGetRun: vi.fn()
}));

vi.mock('$lib/server/services/moora-history.js', () => ({
	getCalculationHistoryPage: mockGetHistoryPage,
	getCalculationRun: mockGetRun
}));

const runId = '00000000-0000-4000-8000-000000000001';

describe('calculation history routes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('passes a valid page to the history service', async () => {
		mockGetHistoryPage.mockResolvedValue({ runs: [], pagination: {} });

		await loadHistory({
			url: new URL('https://example.com/admin/calculation-history?page=2')
		} as Parameters<typeof loadHistory>[0]);

		expect(mockGetHistoryPage).toHaveBeenCalledWith(2);
	});

	it.each(['abc', '0', '-1', '1.5'])('uses page one for invalid page %s', async (page) => {
		mockGetHistoryPage.mockResolvedValue({ runs: [], pagination: {} });

		await loadHistory({
			url: new URL(`https://example.com/admin/calculation-history?page=${page}`)
		} as Parameters<typeof loadHistory>[0]);

		expect(mockGetHistoryPage).toHaveBeenCalledWith(1);
	});

	it('returns a generic list database error', async () => {
		mockGetHistoryPage.mockRejectedValue(new Error('sensitive database details'));

		let caught: unknown;
		try {
			await loadHistory({
				url: new URL('https://example.com/admin/calculation-history')
			} as Parameters<typeof loadHistory>[0]);
		} catch (error) {
			caught = error;
		}

		expect(caught).toMatchObject({ status: 500 });
		expect(JSON.stringify(caught)).not.toContain('sensitive database details');
	});

	it('rejects an invalid UUID without querying the service', async () => {
		await expect(
			loadDetail({ params: { id: 'invalid' } } as Parameters<typeof loadDetail>[0])
		).rejects.toMatchObject({ status: 404 });
		expect(mockGetRun).not.toHaveBeenCalled();
	});

	it('returns 404 when a run does not exist', async () => {
		mockGetRun.mockResolvedValue(null);

		await expect(
			loadDetail({ params: { id: runId } } as Parameters<typeof loadDetail>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('returns a generic detail database error', async () => {
		mockGetRun.mockRejectedValue(new Error('sensitive database details'));

		let caught: unknown;
		try {
			await loadDetail({ params: { id: runId } } as Parameters<typeof loadDetail>[0]);
		} catch (error) {
			caught = error;
		}

		expect(caught).toMatchObject({ status: 500 });
		expect(JSON.stringify(caught)).not.toContain('sensitive database details');
	});
});
