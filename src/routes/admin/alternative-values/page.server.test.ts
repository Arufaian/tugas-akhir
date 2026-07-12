import { beforeEach, describe, expect, it, vi } from 'vitest';

import { load } from './+page.server.js';

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock('$lib/server/db', () => ({ db: { select: mockSelect } }));

const alternativeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const criterionId = '11111111-1111-4111-8111-111111111111';

function activeQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function orderedQuery(rows: unknown[]) {
	return { from: () => ({ orderBy: async () => rows }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function setup(rawValue: string) {
	mockSelect
		.mockReturnValueOnce(activeQuery([{ id: alternativeId, code: 'A1', name: 'Alternative Test' }]))
		.mockReturnValueOnce(
			activeQuery([
				{
					id: criterionId,
					code: 'C1',
					name: 'Skala Test',
					type: 'benefit',
					inputType: 'scale',
					normalizedWeight: '1.000000000'
				}
			])
		)
		.mockReturnValueOnce(orderedQuery([{ criterionId, label: 'Cukup', value: '3.0000' }]))
		.mockReturnValueOnce(
			rowsQuery([{ alternativeId, criterionId, rawValue, labelValue: 'Cukup' }])
		);
}

describe('alternative values overview scale readiness', () => {
	beforeEach(() => vi.resetAllMocks());

	it('does not count an orphan scale value as filled', async () => {
		setup('4.0000');

		const result = await load();

		expect(result.summary.filledCellCount).toBe(0);
		expect(result.completeness.alternatives[0].missingCriteria[0]).toMatchObject({
			code: 'C1',
			reason: 'invalid_scale'
		});
	});

	it('counts a scale value that still matches an option', async () => {
		setup('3.0000');

		const result = await load();

		expect(result.summary.filledCellCount).toBe(1);
		expect(result.completeness.isComplete).toBe(true);
	});
});
