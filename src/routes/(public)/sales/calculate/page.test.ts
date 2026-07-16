import { describe, expect, it } from 'vitest';

import { filterAlternatives, mockAlternatives, rankAlternatives } from './mock.js';

describe('sales calculation mock', () => {
	it('filters inclusively and ranks candidates without mutating the source', () => {
		const candidates = filterAlternatives(
			mockAlternatives,
			'Matic',
			[19_195_000, 20_140_000]
		).reverse();
		const originalOrder = candidates.map((alternative) => alternative.id);
		const ranked = rankAlternatives(candidates);

		expect(candidates.map((alternative) => alternative.name)).toEqual([
			'Gear 125 Ultima Hybrid',
			'Gear 125'
		]);
		expect(ranked.map((alternative) => alternative.name)).toEqual([
			'Gear 125',
			'Gear 125 Ultima Hybrid'
		]);
		expect(candidates.map((alternative) => alternative.id)).toEqual(originalOrder);
	});
});
