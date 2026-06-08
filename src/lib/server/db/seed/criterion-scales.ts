import { db } from '../index';
import { criterionScalesTable } from '../schema';
import type { CriteriaMap } from './criteria';

const criterionScalesSeed: (criteriaMap: CriteriaMap) => Array<{
	criterionId: string;
	label: string;
	value: string;
	description: string;
	orderIndex: number;
}> = (criteriaMap) => [
	{
		criterionId: criteriaMap.get('C5')!,
		label: 'Eksklusif',
		value: '1',
		description: 'Sparepart relatif terbatas',
		orderIndex: 1
	},
	{
		criterionId: criteriaMap.get('C5')!,
		label: 'Menengah',
		value: '2',
		description: 'Sparepart cukup tersedia',
		orderIndex: 2
	},
	{
		criterionId: criteriaMap.get('C5')!,
		label: 'Berlimpah',
		value: '3',
		description: 'Sparepart mudah diperoleh',
		orderIndex: 3
	},
	{
		criterionId: criteriaMap.get('C7')!,
		label: 'Ready stock / inden < 1 minggu',
		value: '1',
		description: 'Unit tersedia atau waktu tunggu sangat singkat',
		orderIndex: 1
	},
	{
		criterionId: criteriaMap.get('C7')!,
		label: 'Inden 1\u20132 minggu',
		value: '2',
		description: 'Waktu tunggu singkat',
		orderIndex: 2
	},
	{
		criterionId: criteriaMap.get('C7')!,
		label: 'Inden 3 minggu\u20131 bulan',
		value: '3',
		description: 'Waktu tunggu menengah',
		orderIndex: 3
	},
	{
		criterionId: criteriaMap.get('C7')!,
		label: 'Inden > 1 bulan',
		value: '4',
		description: 'Waktu tunggu panjang',
		orderIndex: 4
	}
];

export async function seedCriterionScales(criteriaMap: CriteriaMap): Promise<void> {
	const values = criterionScalesSeed(criteriaMap);
	await db.insert(criterionScalesTable).values(values);
	console.log(`Inserted ${values.length} criterion scales.`);
}
