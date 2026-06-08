import { describe, it, expect } from 'vitest';
import { recalcNormalizedWeights } from './normalize';

describe('recalcNormalizedWeights', () => {
	it('returns empty array for empty input', () => {
		const result = recalcNormalizedWeights([]);
		expect(result).toEqual([]);
	});

	it('returns normalizedWeight = 1 for single active criterion', () => {
		const result = recalcNormalizedWeights([{ rawWeight: 5, isActive: true }]);
		expect(result[0].normalizedWeight).toBe(1);
	});

	it('computes correct weights for multiple active criteria', () => {
		const result = recalcNormalizedWeights([
			{ rawWeight: 4, isActive: true },
			{ rawWeight: 5, isActive: true },
			{ rawWeight: 2, isActive: true }
		]);

		expect(result[0].normalizedWeight).toBeCloseTo(4 / 11, 9);
		expect(result[1].normalizedWeight).toBeCloseTo(5 / 11, 9);
		expect(result[2].normalizedWeight).toBeCloseTo(2 / 11, 9);
	});

	it('assigns weight 0 to inactive criteria', () => {
		const result = recalcNormalizedWeights([
			{ rawWeight: 4, isActive: true },
			{ rawWeight: 5, isActive: false },
			{ rawWeight: 2, isActive: true }
		]);

		expect(result[0].normalizedWeight).toBeCloseTo(4 / 6, 9);
		expect(result[1].normalizedWeight).toBe(0);
		expect(result[2].normalizedWeight).toBeCloseTo(2 / 6, 9);
	});

	it('returns 0 for all inactive criteria (no NaN)', () => {
		const result = recalcNormalizedWeights([
			{ rawWeight: 4, isActive: false },
			{ rawWeight: 5, isActive: false }
		]);

		expect(result.every((c) => c.normalizedWeight === 0)).toBe(true);
		result.forEach((c) => {
			expect(Number.isNaN(c.normalizedWeight)).toBe(false);
		});
	});

	it('preserves extra properties via generic T', () => {
		const result = recalcNormalizedWeights([
			{ code: 'C1', name: 'Test', rawWeight: 4, isActive: true, orderIndex: 1 }
		]);

		expect(result[0].code).toBe('C1');
		expect(result[0].name).toBe('Test');
		expect(result[0].orderIndex).toBe(1);
	});

	it('normalized weights sum to approximately 1', () => {
		const result = recalcNormalizedWeights([
			{ rawWeight: 4, isActive: true },
			{ rawWeight: 5, isActive: true },
			{ rawWeight: 2, isActive: true },
			{ rawWeight: 3, isActive: true },
			{ rawWeight: 1, isActive: true },
			{ rawWeight: 5, isActive: true },
			{ rawWeight: 3, isActive: true }
		]);

		const sum = result.reduce((acc, c) => acc + c.normalizedWeight, 0);
		expect(sum).toBeCloseTo(1, 9);
	});
});
