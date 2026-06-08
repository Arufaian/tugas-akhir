import { db } from '../index';
import { criteriaTable } from '../schema';
import { seedCriteria } from './criteria';
import { seedTechnologyFeatures } from './technology-features';
import { seedCriterionScales } from './criterion-scales';

async function main() {
	const existing = await db.select({ id: criteriaTable.id }).from(criteriaTable).limit(1);
	if (existing.length > 0) {
		console.log('Seed data already exists. Skipping.');
		process.exit(0);
	}

	const criteriaMap = await seedCriteria();
	await seedTechnologyFeatures();
	await seedCriterionScales(criteriaMap);

	console.log('\nSeed complete.');
	process.exit(0);
}

main();
