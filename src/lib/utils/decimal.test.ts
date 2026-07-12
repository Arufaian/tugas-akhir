import { describe, expect, it } from 'vitest';

import { canonicalDecimal } from './decimal.js';

describe('canonicalDecimal', () => {
	it.each([
		['20.0000', '20'],
		['20.5000', '20.5'],
		['0.0000', '0'],
		['00020.0500', '20.05']
	])('normalizes %s to %s', (value, expected) => {
		expect(canonicalDecimal(value)).toBe(expected);
	});
});
