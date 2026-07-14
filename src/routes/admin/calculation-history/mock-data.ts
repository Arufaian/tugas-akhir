export type CalculationRunSummary = {
	id: string;
	name: string;
	createdAt: Date;
	createdByName: string;
	alternativeCount: number;
	criteriaCount: number;
};

export type CalculationHistoryPage = {
	runs: CalculationRunSummary[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
};

const pageSize = 10;
const creators = ['Alfian Rufianto', 'Administrator', 'Dewi Anggraini'];

const runs: CalculationRunSummary[] = Array.from({ length: 12 }, (_, index) => ({
	id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
	name: `Evaluasi Motor Harian #${12 - index}`,
	createdAt: new Date(Date.UTC(2026, 6, 14 - index, 3 + (index % 4), 15)),
	createdByName: creators[index % creators.length],
	alternativeCount: 4,
	criteriaCount: 4
}));

const snapshot = {
	criteria: [
		{
			id: '10000000-0000-4000-8000-000000000001',
			code: 'C1',
			name: 'Harga OTR',
			unit: 'juta rupiah',
			type: 'cost' as const,
			weight: 0.35,
			denominator: 53.349133
		},
		{
			id: '10000000-0000-4000-8000-000000000002',
			code: 'C2',
			name: 'Kapasitas Mesin',
			unit: 'cc',
			type: 'benefit' as const,
			weight: 0.25,
			denominator: 281.691321
		},
		{
			id: '10000000-0000-4000-8000-000000000003',
			code: 'C3',
			name: 'Efisiensi Bahan Bakar',
			unit: 'km/l',
			type: 'benefit' as const,
			weight: 0.25,
			denominator: 94.244363
		},
		{
			id: '10000000-0000-4000-8000-000000000004',
			code: 'C4',
			name: 'Kelengkapan Fitur',
			unit: 'skala',
			type: 'benefit' as const,
			weight: 0.15,
			denominator: 7.681146
		}
	],
	alternatives: [
		{
			id: '20000000-0000-4000-8000-000000000001',
			code: 'A1',
			name: 'Honda Vario 125'
		},
		{
			id: '20000000-0000-4000-8000-000000000002',
			code: 'A2',
			name: 'Yamaha Aerox 155'
		},
		{
			id: '20000000-0000-4000-8000-000000000003',
			code: 'A3',
			name: 'Honda Beat Deluxe'
		},
		{
			id: '20000000-0000-4000-8000-000000000004',
			code: 'A4',
			name: 'Yamaha NMAX 155'
		}
	],
	matrixRows: [
		{
			alternativeId: '20000000-0000-4000-8000-000000000001',
			raw: [25.5, 125, 48, 3],
			labels: [null, null, null, 'Standar'],
			normalized: [0.477983, 0.443748, 0.509314, 0.390567],
			weighted: [0.167294, 0.110937, 0.127329, 0.058585]
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000002',
			raw: [27.2, 150, 45, 4],
			labels: [null, null, null, 'Lengkap'],
			normalized: [0.509848, 0.532497, 0.477482, 0.520756],
			weighted: [0.178447, 0.133124, 0.119371, 0.078113]
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000003',
			raw: [24.8, 125, 52, 3],
			labels: [null, null, null, 'Standar'],
			normalized: [0.464861, 0.443748, 0.551757, 0.390567],
			weighted: [0.162701, 0.110937, 0.137939, 0.058585]
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000004',
			raw: [29, 160, 43, 5],
			labels: [null, null, null, 'Sangat lengkap'],
			normalized: [0.543589, 0.567997, 0.45626, 0.650945],
			weighted: [0.190256, 0.141999, 0.114065, 0.097642]
		}
	],
	results: [
		{
			alternativeId: '20000000-0000-4000-8000-000000000004',
			totalBenefit: 0.353706,
			totalCost: 0.190256,
			optimizationScore: 0.16345,
			rank: 1
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000002',
			totalBenefit: 0.330608,
			totalCost: 0.178447,
			optimizationScore: 0.152161,
			rank: 2
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000003',
			totalBenefit: 0.307461,
			totalCost: 0.162701,
			optimizationScore: 0.14476,
			rank: 3
		},
		{
			alternativeId: '20000000-0000-4000-8000-000000000001',
			totalBenefit: 0.296851,
			totalCost: 0.167294,
			optimizationScore: 0.129557,
			rank: 4
		}
	]
};

export function getMockCalculationHistory(page: number, empty = false): CalculationHistoryPage {
	const source = empty ? [] : runs;
	const totalPages = Math.max(1, Math.ceil(source.length / pageSize));
	const currentPage = Math.min(Math.max(page, 1), totalPages);

	return {
		runs: source.slice((currentPage - 1) * pageSize, currentPage * pageSize),
		pagination: {
			page: currentPage,
			pageSize,
			totalItems: source.length,
			totalPages
		}
	};
}

export function getMockCalculationRun(id: string) {
	const run = runs.find((item) => item.id === id);

	if (!run) return null;

	// ponytail: one shared snapshot is enough to validate every mock detail route.
	return { run, ...snapshot };
}
