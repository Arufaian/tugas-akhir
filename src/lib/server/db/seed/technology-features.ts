import { db } from '../index';
import { technologyFeaturesTable } from '../schema';

const technologyFeaturesSeed = [
	{ aspect: 'Keselamatan', name: 'ABS', score: '15', description: null as null | string },
	{ aspect: 'Keselamatan', name: 'TCS', score: '15', description: null as null | string },
	{ aspect: 'Performa', name: 'VVA', score: '10', description: null as null | string },
	{ aspect: 'Performa', name: 'YECVT', score: '25', description: null as null | string },
	{
		aspect: 'Performa',
		name: 'Y-Shift/Riding Mode',
		score: '5',
		description: null as null | string
	},
	{
		aspect: 'Efisiensi Tambahan',
		name: 'Hybrid Power Assist',
		score: '10',
		description: null as null | string
	},
	{ aspect: 'Efisiensi Tambahan', name: 'SSS', score: '5', description: null as null | string },
	{
		aspect: 'Ekosistem Digital',
		name: 'Smart Key',
		score: '5',
		description: null as null | string
	},
	{
		aspect: 'Ekosistem Digital',
		name: 'Y-Connect',
		score: '5',
		description: null as null | string
	},
	{
		aspect: 'Ekosistem Digital',
		name: 'TFT Display',
		score: '5',
		description: null as null | string
	}
];

export async function seedTechnologyFeatures(): Promise<void> {
	const existing = await db
		.select({ id: technologyFeaturesTable.id })
		.from(technologyFeaturesTable)
		.limit(1);
	if (existing.length > 0) {
		console.log('Technology features already seeded. Skipping.');
		return;
	}

	await db.insert(technologyFeaturesTable).values(technologyFeaturesSeed);
	console.log(`Inserted ${technologyFeaturesSeed.length} technology features.`);
}
