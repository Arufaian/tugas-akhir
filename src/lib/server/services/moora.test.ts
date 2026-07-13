import { describe, expect, it } from 'vitest';

import { calculateMoora, type MooraInput } from './moora.js';

function guideInput(): MooraInput {
	return {
		alternatives: [
			{ id: 'a3', code: 'A3', name: 'Alternative 3' },
			{ id: 'a1', code: 'A1', name: 'Alternative 1' },
			{ id: 'a2', code: 'A2', name: 'Alternative 2' }
		],
		criteria: [
			{
				id: 'c3',
				code: 'C3',
				name: 'Layanan',
				unit: 'poin',
				orderIndex: 3,
				type: 'benefit',
				inputType: 'number',
				normalizedWeight: '0.25'
			},
			{
				id: 'c1',
				code: 'C1',
				name: 'Kualitas',
				unit: 'poin',
				orderIndex: 1,
				type: 'benefit',
				inputType: 'number',
				normalizedWeight: '0.40'
			},
			{
				id: 'c2',
				code: 'C2',
				name: 'Harga',
				unit: 'juta rupiah',
				orderIndex: 2,
				type: 'cost',
				inputType: 'number',
				normalizedWeight: '0.35'
			}
		],
		values: [
			{ alternativeId: 'a1', criterionId: 'c1', rawValue: '80', labelValue: null },
			{ alternativeId: 'a1', criterionId: 'c2', rawValue: '50', labelValue: null },
			{ alternativeId: 'a1', criterionId: 'c3', rawValue: '70', labelValue: null },
			{ alternativeId: 'a2', criterionId: 'c1', rawValue: '70', labelValue: null },
			{ alternativeId: 'a2', criterionId: 'c2', rawValue: '40', labelValue: null },
			{ alternativeId: 'a2', criterionId: 'c3', rawValue: '80', labelValue: null },
			{ alternativeId: 'a3', criterionId: 'c1', rawValue: '90', labelValue: null },
			{ alternativeId: 'a3', criterionId: 'c2', rawValue: '60', labelValue: null },
			{ alternativeId: 'a3', criterionId: 'c3', rawValue: '75', labelValue: null }
		],
		scales: []
	};
}

function singleCriterionInput({
	rawValue = '10',
	normalizedWeight = '1',
	inputType = 'number',
	labelValue = null,
	scales = []
}: {
	rawValue?: string;
	normalizedWeight?: string;
	inputType?: 'number' | 'scale' | 'tech_features';
	labelValue?: string | null;
	scales?: Array<{ criterionId: string; value: string }>;
} = {}): MooraInput {
	return {
		alternatives: [{ id: 'a1', code: 'A1', name: 'Alternative 1' }],
		criteria: [
			{
				id: 'c1',
				code: 'C1',
				name: 'Criterion 1',
				unit: 'poin',
				orderIndex: 1,
				type: 'benefit',
				inputType,
				normalizedWeight
			}
		],
		values: [{ alternativeId: 'a1', criterionId: 'c1', rawValue, labelValue }],
		scales
	};
}

describe('calculateMoora', () => {
	it('calculates matrices, scores, ranking, and snapshots', () => {
		const result = calculateMoora(guideInput());

		expect(result.success).toBe(true);
		if (!result.success) throw new Error(result.issues.join(', '));

		expect(result.alternatives.map((alternative) => alternative.code)).toEqual(['A1', 'A2', 'A3']);
		expect(result.criteria.map((criterion) => criterion.code)).toEqual(['C1', 'C2', 'C3']);
		expect(result.decisionMatrix).toEqual([
			[80, 50, 70],
			[70, 40, 80],
			[90, 60, 75]
		]);
		expect(result.denominators[0]).toBeCloseTo(139.283883, 6);
		expect(result.normalizedMatrix[0][0]).toBeCloseTo(0.574367, 6);
		expect(result.weightedMatrix[0][0]).toBeCloseTo(0.229747, 6);
		expect(result.results.map(({ code, rank }) => ({ code, rank }))).toEqual([
			{ code: 'A2', rank: 1 },
			{ code: 'A1', rank: 2 },
			{ code: 'A3', rank: 3 }
		]);
		expect(result.results[0].optimizationScore).toBeCloseTo(0.195216, 6);
		expect(result.details).toHaveLength(9);
		expect(
			result.details.find((detail) => detail.alternativeId === 'a1' && detail.criterionId === 'c2')
		).toMatchObject({
			criterionCode: 'C2',
			criterionName: 'Harga',
			criterionUnit: 'juta rupiah',
			criterionOrderIndex: 2,
			criterionType: 'cost',
			criterionInputType: 'number',
			rawValue: 50,
			labelValue: null,
			weight: 0.35
		});
	});

	it('rejects incomplete and invalid scale matrices', () => {
		const incomplete = guideInput();
		incomplete.values.pop();
		const invalidScale = singleCriterionInput({
			rawValue: '2',
			inputType: 'scale',
			labelValue: 'Cukup',
			scales: [{ criterionId: 'c1', value: '3' }]
		});

		expect(calculateMoora(incomplete)).toEqual({
			success: false,
			issues: [expect.stringContaining('Decision matrix')]
		});
		expect(calculateMoora(invalidScale)).toEqual({
			success: false,
			issues: [expect.stringContaining('nilai scale tidak valid')]
		});
	});

	it.each([
		{ normalizedWeight: '0', issue: 'Normalized weight' },
		{ normalizedWeight: '0.5', issue: 'Total normalized weight' },
		{ normalizedWeight: 'NaN', issue: 'Normalized weight' }
	])('rejects invalid normalized weight $normalizedWeight', ({ normalizedWeight, issue }) => {
		const result = calculateMoora(singleCriterionInput({ normalizedWeight }));

		expect(result).toEqual({
			success: false,
			issues: [expect.stringContaining(issue)]
		});
	});

	it.each(['-1', 'Infinity'])('rejects invalid raw value %s', (rawValue) => {
		const result = calculateMoora(singleCriterionInput({ rawValue }));

		expect(result).toEqual({
			success: false,
			issues: [expect.stringContaining('finite dan nonnegatif')]
		});
	});

	it('rejects a zero normalization denominator', () => {
		const result = calculateMoora(singleCriterionInput({ rawValue: '0' }));

		expect(result).toEqual({
			success: false,
			issues: [expect.stringContaining('pembagi normalisasi C1')]
		});
	});

	it('uses alternative code as the score tie-breaker', () => {
		const input = singleCriterionInput();
		input.alternatives = [
			{ id: 'a2', code: 'A2', name: 'Alternative 2' },
			{ id: 'a1', code: 'A1', name: 'Alternative 1' }
		];
		input.values.push({
			alternativeId: 'a2',
			criterionId: 'c1',
			rawValue: '10',
			labelValue: null
		});

		const result = calculateMoora(input);

		expect(result.success).toBe(true);
		if (!result.success) throw new Error(result.issues.join(', '));
		expect(result.results.map(({ code, rank }) => ({ code, rank }))).toEqual([
			{ code: 'A1', rank: 1 },
			{ code: 'A2', rank: 2 }
		]);
	});

	it('creates a readable technology feature label', () => {
		const result = calculateMoora(
			singleCriterionInput({
				rawValue: '25',
				inputType: 'tech_features',
				labelValue: JSON.stringify(['abs', 'vva'])
			})
		);

		expect(result.success).toBe(true);
		if (!result.success) throw new Error(result.issues.join(', '));
		expect(result.details[0].labelValue).toBe('ABS, VVA');
	});

	it.each([
		{ rawValue: '25', labelValue: 'not-json', issue: 'Daftar fitur' },
		{ rawValue: '20', labelValue: JSON.stringify(['abs', 'vva']), issue: 'tidak konsisten' }
	])('rejects invalid technology feature data', ({ rawValue, labelValue, issue }) => {
		const result = calculateMoora(
			singleCriterionInput({ rawValue, inputType: 'tech_features', labelValue })
		);

		expect(result).toEqual({
			success: false,
			issues: [expect.stringContaining(issue)]
		});
	});
});
