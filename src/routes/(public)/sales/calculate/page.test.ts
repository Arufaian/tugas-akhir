import { stringify } from 'devalue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server.js';

const { mockSelect, mockCalculateMoora } = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockCalculateMoora: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ db: { select: mockSelect } }));
vi.mock('$lib/server/services/moora.js', () => ({ calculateMoora: mockCalculateMoora }));

const alternatives = [
	{
		id: 'a1',
		code: 'A1',
		name: 'Motor Satu',
		category: 'Matic',
		img: { url: 'https://example.com/a1.png', path: null }
	},
	{ id: 'a2', code: 'A2', name: 'Motor Dua', category: 'Matic', img: null },
	{ id: 'a3', code: 'A3', name: 'Motor Tiga', category: 'Sport', img: null }
];
const criteria = [
	{
		id: 'c1',
		code: 'C1',
		name: 'Harga',
		unit: 'Rp',
		orderIndex: 1,
		type: 'cost',
		inputType: 'number',
		normalizedWeight: '0.500000000',
		isPrice: true
	},
	{
		id: 'c2',
		code: 'C2',
		name: 'Kualitas',
		unit: 'poin',
		orderIndex: 2,
		type: 'benefit',
		inputType: 'number',
		normalizedWeight: '0.500000000',
		isPrice: false
	}
];
const values = alternatives.flatMap((alternative, index) => [
	{
		alternativeId: alternative.id,
		criterionId: 'c1',
		rawValue: String(20_000_000 + index * 5_000_000),
		labelValue: null
	},
	{
		alternativeId: alternative.id,
		criterionId: 'c2',
		rawValue: String(10 + index * 10),
		labelValue: null
	}
]);

function orderedQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[]) {
	return { from: async () => rows };
}

function filteredQuery(rows: unknown[]) {
	return { from: () => ({ where: async () => rows }) };
}

function setupData({
	alternativeRows = alternatives,
	criterionRows = criteria,
	valueRows = values
}: {
	alternativeRows?: unknown[];
	criterionRows?: unknown[];
	valueRows?: unknown[];
} = {}) {
	mockSelect
		.mockReturnValueOnce(orderedQuery(alternativeRows))
		.mockReturnValueOnce(orderedQuery(criterionRows))
		.mockReturnValueOnce(rowsQuery(valueRows))
		.mockReturnValueOnce(filteredQuery([]));
}

function calculationEvent(category: string, priceRange: [number, number]) {
	const body = new FormData();
	body.set('__superform_json', stringify({ category, priceRange }));

	return {
		request: new Request('http://localhost/sales/calculate?/calculate', {
			method: 'POST',
			body
		})
	} as Parameters<NonNullable<typeof actions.calculate>>[0];
}

describe('sales calculation backend', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('loads the real catalog, categories, images, and rounded price range', async () => {
		setupData();

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected page data');
		expect(result.categories).toEqual(['Matic', 'Sport']);
		expect(result.priceRange).toEqual([20_000_000, 30_000_000]);
		expect(result.catalog).toHaveLength(3);
		expect(result.catalog[0]).toMatchObject({
			code: 'A1',
			price: 20_000_000,
			imageUrl: 'https://example.com/a1.png',
			isComplete: true
		});
		expect(result.form.data).toEqual({ category: 'all', priceRange: [20_000_000, 30_000_000] });
	});

	it('reports when the admin has not selected a price criterion', async () => {
		setupData({ criterionRows: criteria.map((criterion) => ({ ...criterion, isPrice: false })) });

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected page data');
		expect(result.catalog).toEqual([]);
		expect(result.priceRange).toBeNull();
		expect(result.issues).toContain('Admin belum menetapkan kriteria sumber harga');
	});

	it('does not silently omit an alternative without a price', async () => {
		setupData({
			valueRows: values.filter(
				(value) => value.alternativeId !== 'a2' || value.criterionId !== 'c1'
			)
		});

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toBeDefined();
		if (!result) throw new Error('Expected page data');
		expect(result.catalog).toEqual([]);
		expect(result.issues).toContain('Harga belum diisi atau tidak valid untuk A2');
	});

	it('rejects an invalid range before reading the database', async () => {
		const result = await actions.calculate!(calculationEvent('all', [30_000_000, 20_000_000]));

		expect(result).toMatchObject({ status: 400 });
		expect(mockSelect).not.toHaveBeenCalled();
		expect(mockCalculateMoora).not.toHaveBeenCalled();
	});

	it('filters inclusive boundaries and calculates only the matching candidates', async () => {
		setupData();
		mockCalculateMoora.mockReturnValue({
			success: true,
			results: [
				{
					id: 'a2',
					code: 'A2',
					name: 'Motor Dua',
					totalBenefit: 0.4,
					totalCost: 0.2,
					optimizationScore: 0.2,
					rank: 1
				},
				{
					id: 'a1',
					code: 'A1',
					name: 'Motor Satu',
					totalBenefit: 0.2,
					totalCost: 0.3,
					optimizationScore: -0.1,
					rank: 2
				}
			]
		});

		const result = await actions.calculate!(calculationEvent('Matic', [20_000_000, 25_000_000]));
		const input = mockCalculateMoora.mock.calls[0][0];

		expect(input.alternatives.map((alternative: { id: string }) => alternative.id)).toEqual([
			'a1',
			'a2'
		]);
		expect(input.criteria).toEqual(criteria);
		expect(input.values).toHaveLength(4);
		expect(result).toMatchObject({
			calculation: {
				filter: { category: 'Matic', priceRange: [20_000_000, 25_000_000] },
				results: [
					{ id: 'a2', rank: 1, price: 25_000_000 },
					{ id: 'a1', rank: 2, price: 20_000_000 }
				]
			}
		});
	});

	it('stops before MOORA when fewer than two candidates match', async () => {
		setupData();

		const result = await actions.calculate!(calculationEvent('Matic', [20_000_000, 20_000_000]));

		expect(result).toMatchObject({
			status: 400,
			data: { issues: ['Perhitungan membutuhkan minimal dua motor'] }
		});
		expect(mockCalculateMoora).not.toHaveBeenCalled();
	});

	it('stops before MOORA when a candidate matrix is incomplete', async () => {
		setupData({
			valueRows: values.filter(
				(value) => value.alternativeId !== 'a2' || value.criterionId !== 'c2'
			)
		});

		const result = await actions.calculate!(calculationEvent('Matic', [20_000_000, 25_000_000]));

		expect(result).toMatchObject({
			status: 400,
			data: { issues: ['Data kandidat belum lengkap'] }
		});
		expect(mockCalculateMoora).not.toHaveBeenCalled();
	});
});
