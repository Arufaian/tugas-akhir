import { db } from '../index';
import { criteriaTable } from '../schema';
import { recalcNormalizedWeights } from '../../../utils/normalize';

const criteriaSeed = [
	{
		code: 'C1',
		name: 'Kapasitas Mesin',
		unit: 'cc',
		rawWeight: 4,
		type: 'benefit' as const,
		orderIndex: 1,
		description: null as null,
		isActive: true
	},
	{
		code: 'C2',
		name: 'Teknologi',
		unit: 'skor',
		rawWeight: 5,
		type: 'benefit' as const,
		orderIndex: 2,
		description: null as null,
		isActive: true
	},
	{
		code: 'C3',
		name: 'Konsumsi Bahan Bakar',
		unit: 'km/liter',
		rawWeight: 2,
		type: 'benefit' as const,
		orderIndex: 3,
		description: null as null,
		isActive: true
	},
	{
		code: 'C4',
		name: 'Tahun Perakitan',
		unit: 'tahun',
		rawWeight: 3,
		type: 'benefit' as const,
		orderIndex: 4,
		description: null as null,
		isActive: true
	},
	{
		code: 'C5',
		name: 'Ketersediaan Sparepart',
		unit: 'skor',
		rawWeight: 1,
		type: 'benefit' as const,
		orderIndex: 5,
		description: null as null,
		isActive: true
	},
	{
		code: 'C6',
		name: 'Harga',
		unit: 'juta rupiah',
		rawWeight: 5,
		type: 'cost' as const,
		orderIndex: 6,
		description: null as null,
		isActive: true
	},
	{
		code: 'C7',
		name: 'Lama Inden Unit',
		unit: 'skor',
		rawWeight: 3,
		type: 'cost' as const,
		orderIndex: 7,
		description: null as null,
		isActive: true
	}
];

export type CriteriaMap = Map<string, string>;

export async function seedCriteria(): Promise<CriteriaMap> {
	const withNormalized = recalcNormalizedWeights(criteriaSeed);
	const criteriaValues = withNormalized.map((c) => ({
		code: c.code,
		name: c.name,
		description: c.description,
		unit: c.unit,
		rawWeight: String(c.rawWeight),
		normalizedWeight: String(c.normalizedWeight),
		type: c.type,
		orderIndex: c.orderIndex
	}));

	await db.insert(criteriaTable).values(criteriaValues);
	console.log(`Inserted ${criteriaValues.length} criteria.`);

	const criteriaRows = await db
		.select({ id: criteriaTable.id, code: criteriaTable.code })
		.from(criteriaTable);
	return new Map(criteriaRows.map((r) => [r.code, r.id]));
}
