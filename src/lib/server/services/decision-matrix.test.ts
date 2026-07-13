import { describe, expect, it } from 'vitest';

import { checkDecisionMatrixCompleteness } from './decision-matrix.js';

const alternatives = [
	{ id: 'alternative-1', code: 'A1', name: 'Alternative 1' },
	{ id: 'alternative-2', code: 'A2', name: 'Alternative 2' }
];
const numberCriterion = {
	id: 'criterion-1',
	code: 'C1',
	name: 'Number',
	inputType: 'number' as const
};
const scaleCriterion = {
	id: 'criterion-2',
	code: 'C2',
	name: 'Scale',
	inputType: 'scale' as const
};

function check({
	selectedAlternatives = alternatives,
	criteria = [numberCriterion],
	values = [],
	scales = []
}: {
	selectedAlternatives?: typeof alternatives;
	criteria?: Array<typeof numberCriterion | typeof scaleCriterion>;
	values?: Array<{ alternativeId: string; criterionId: string; rawValue: string }>;
	scales?: Array<{ criterionId: string; value: string }>;
} = {}) {
	return checkDecisionMatrixCompleteness({
		alternatives: selectedAlternatives,
		criteria,
		values,
		scales
	});
}

describe('checkDecisionMatrixCompleteness', () => {
	it('reports complete alternatives and cell counts', () => {
		const result = check({
			values: alternatives.map((alternative) => ({
				alternativeId: alternative.id,
				criterionId: numberCriterion.id,
				rawValue: '10'
			}))
		});

		expect(result).toMatchObject({
			isComplete: true,
			totalCellCount: 2,
			filledCellCount: 2,
			emptyCellCount: 0
		});
		expect(result.alternatives.every((alternative) => alternative.isComplete)).toBe(true);
	});

	it('reports missing criteria per alternative', () => {
		const result = check({
			criteria: [numberCriterion, scaleCriterion],
			values: [
				{ alternativeId: alternatives[0].id, criterionId: numberCriterion.id, rawValue: '10' }
			]
		});

		expect(result).toMatchObject({ filledCellCount: 1, emptyCellCount: 3 });
		expect(result.alternatives[0].missingCriteria).toEqual([
			expect.objectContaining({ code: 'C2', reason: 'missing' })
		]);
	});

	it('reports orphan scale values as invalid', () => {
		const result = check({
			selectedAlternatives: alternatives.slice(0, 1),
			criteria: [scaleCriterion],
			scales: [{ criterionId: scaleCriterion.id, value: '3.0000' }],
			values: [
				{ alternativeId: alternatives[0].id, criterionId: scaleCriterion.id, rawValue: '4.0' }
			]
		});

		expect(result.alternatives[0].missingCriteria[0]).toMatchObject({
			code: 'C2',
			reason: 'invalid_scale'
		});
		expect(result.filledCellCount).toBe(0);
	});

	it('matches scale values by canonical decimal', () => {
		const result = check({
			selectedAlternatives: alternatives.slice(0, 1),
			criteria: [scaleCriterion],
			scales: [{ criterionId: scaleCriterion.id, value: '3.0000' }],
			values: [
				{ alternativeId: alternatives[0].id, criterionId: scaleCriterion.id, rawValue: '3.0' }
			]
		});

		expect(result.isComplete).toBe(true);
	});

	it('requires at least one alternative and criterion', () => {
		expect(check({ selectedAlternatives: [] }).isComplete).toBe(false);
		expect(check({ criteria: [] }).isComplete).toBe(false);
	});
});
