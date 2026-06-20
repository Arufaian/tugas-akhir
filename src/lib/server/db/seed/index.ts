import { db } from '../index';
import { alternativesTable } from '../schema';
import { seedAlternatives } from './alternatives';
import { seedCriteria } from './criteria';
import { seedTechnologyFeatures } from './technology-features';
import { seedCriterionScales } from './criterion-scales';

async function main() {
	const existing = await db.select({ id: alternativesTable.id }).from(alternativesTable).limit(1);
	if (existing.length > 0) {
		console.log('Seed data already exists. Skipping.');
		process.exit(0);
	}

	const criteriaMap = await seedCriteria();
	await seedTechnologyFeatures();
	await seedCriterionScales(criteriaMap);
	await seedAlternatives();

	console.log('\nSeed complete.');
	process.exit(0);
}

main();
