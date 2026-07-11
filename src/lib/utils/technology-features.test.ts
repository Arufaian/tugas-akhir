import { describe, expect, it } from 'vitest';
import { technologyFeatures } from '$lib/constants/technology-features';
import { calculateTechnologyScore } from './technology-features';

describe('technology features', () => {
	it('totals 100 points', () => {
		expect(calculateTechnologyScore(technologyFeatures.map((feature) => feature.id))).toBe(100);
	});

	it('calculates selected features', () => {
		expect(calculateTechnologyScore(['abs', 'vva', 'smart-key'])).toBe(30);
	});

	it('rejects unknown and duplicate features', () => {
		expect(() => calculateTechnologyScore(['unknown'])).toThrow('Unknown technology feature');
		expect(() => calculateTechnologyScore(['abs', 'abs'])).toThrow('Duplicate technology feature');
	});
});
