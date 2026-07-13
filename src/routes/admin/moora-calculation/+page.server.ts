import type { PageServerLoad } from './$types.js';

const criteria = [
	{
		id: 'c1',
		code: 'C1',
		name: 'Kapasitas Mesin',
		unit: 'cc',
		type: 'benefit',
		weight: 0.173913043,
		denominator: 365.239647355
	},
	{
		id: 'c2',
		code: 'C2',
		name: 'Teknologi',
		unit: 'skor',
		type: 'benefit',
		weight: 0.217391304,
		denominator: 8.888194417
	},
	{
		id: 'c3',
		code: 'C3',
		name: 'Konsumsi Bahan Bakar',
		unit: 'km/liter',
		type: 'benefit',
		weight: 0.086956522,
		denominator: 99.085821387
	},
	{
		id: 'c4',
		code: 'C4',
		name: 'Tahun Perakitan',
		unit: 'tahun',
		type: 'benefit',
		weight: 0.130434783,
		denominator: 4527.590529189
	},
	{
		id: 'c5',
		code: 'C5',
		name: 'Ketersediaan Sparepart',
		unit: 'skor',
		type: 'benefit',
		weight: 0.043478261,
		denominator: 9.055385138
	},
	{
		id: 'c6',
		code: 'C6',
		name: 'Harga',
		unit: 'juta rupiah',
		type: 'cost',
		weight: 0.217391304,
		denominator: 85.204870753
	},
	{
		id: 'c7',
		code: 'C7',
		name: 'Lama Inden Unit',
		unit: 'skor',
		type: 'cost',
		weight: 0.130434783,
		denominator: 4.358898944
	}
] as const;

const alternatives = [
	{ id: 'a1', code: 'A1', name: 'Grand Filano Hybrid Neo', category: 'Classy' },
	{ id: 'a3', code: 'A3', name: 'FAZZIO HYBRID', category: 'Classy' },
	{ id: 'a6', code: 'A6', name: 'GEAR 125', category: 'Matic' },
	{ id: 'a10', code: 'A10', name: 'X-MAX CONNECTED', category: 'MAXi' },
	{ id: 'a11', code: 'A11', name: 'Aerox Alpha', category: 'MAXi' }
] as const;

const matrixRows = [
	{
		alternativeId: 'a1',
		raw: [125, 4, 45, 2025, 4, 27.5, 2],
		labels: [null, 'Hybrid, Y-Connect, Smart Key', null, null, 'Mudah', null, '2 minggu'],
		normalized: [
			0.342241049, 0.45003516, 0.454151758, 0.44725776, 0.441726104, 0.322751502, 0.458831468
		],
		weighted: [
			0.059520182, 0.097833731, 0.039491457, 0.058337969, 0.019205483, 0.07016337, 0.059847583
		]
	},
	{
		alternativeId: 'a3',
		raw: [125, 3, 50, 2025, 4, 23.9, 1],
		labels: [null, 'Hybrid, Y-Connect', null, null, 'Mudah', null, 'Ready stock'],
		normalized: [
			0.342241049, 0.33752637, 0.504613065, 0.44725776, 0.441726104, 0.280500396, 0.229415734
		],
		weighted: [
			0.059520182, 0.073375298, 0.043879397, 0.058337969, 0.019205483, 0.060978347, 0.029923791
		]
	},
	{
		alternativeId: 'a6',
		raw: [125, 2, 48, 2024, 3, 19, 1],
		labels: [null, 'Stop & Start System', null, null, 'Cukup', null, 'Ready stock'],
		normalized: [
			0.342241049, 0.22501758, 0.484428542, 0.447036892, 0.331294578, 0.222991947, 0.229415734
		],
		weighted: [
			0.059520182, 0.048916865, 0.042124221, 0.05830916, 0.014404112, 0.04847651, 0.029923791
		]
	},
	{
		alternativeId: 'a10',
		raw: [250, 5, 35, 2025, 5, 67.9, 3],
		labels: [null, 'Y-Connect, TFT, Traction Control', null, null, 'Sangat mudah', null, '1 bulan'],
		normalized: [
			0.684482098, 0.56254395, 0.353229145, 0.44725776, 0.55215763, 0.796902799, 0.688247202
		],
		weighted: [
			0.119040365, 0.122292163, 0.030715578, 0.058337969, 0.024006853, 0.173239739, 0.089771374
		]
	},
	{
		alternativeId: 'a11',
		raw: [155, 5, 42, 2025, 4, 31, 2],
		labels: [null, 'Y-Connect, ABS, Traction Control', null, null, 'Mudah', null, '2 minggu'],
		normalized: [
			0.424378901, 0.56254395, 0.423874974, 0.44725776, 0.441726104, 0.363828966, 0.458831468
		],
		weighted: [
			0.073805026, 0.122292163, 0.036858693, 0.058337969, 0.019205483, 0.079093253, 0.059847583
		]
	}
] as const;

const results = [
	{
		alternativeId: 'a11',
		totalBenefit: 0.310499334,
		totalCost: 0.138940836,
		optimizationScore: 0.171558498,
		rank: 1
	},
	{
		alternativeId: 'a3',
		totalBenefit: 0.254318329,
		totalCost: 0.090902138,
		optimizationScore: 0.163416191,
		rank: 2
	},
	{
		alternativeId: 'a6',
		totalBenefit: 0.22327454,
		totalCost: 0.078400301,
		optimizationScore: 0.144874239,
		rank: 3
	},
	{
		alternativeId: 'a1',
		totalBenefit: 0.274388822,
		totalCost: 0.130010953,
		optimizationScore: 0.144377869,
		rank: 4
	},
	{
		alternativeId: 'a10',
		totalBenefit: 0.354392928,
		totalCost: 0.263011113,
		optimizationScore: 0.091381815,
		rank: 5
	}
] as const;

export const load = (() => ({
	readiness: { isReady: true, issues: [] as string[] },
	run: {
		id: 'mock-run-2026-07-13',
		name: 'Perhitungan 13 Juli 2026',
		createdAt: new Date('2026-07-13T03:30:00.000Z'),
		createdByName: 'Administrator',
		alternativeCount: alternatives.length,
		criteriaCount: criteria.length
	},
	criteria,
	alternatives,
	matrixRows,
	results
})) satisfies PageServerLoad;
