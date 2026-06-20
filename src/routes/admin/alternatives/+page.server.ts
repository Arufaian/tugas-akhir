import { db } from '$lib/server/db';
import { alternativesTable } from '$lib/server/db/schema';
import { alternativeImageSchema } from '$lib/validations/alternative.schema.js';

export async function load() {
	const rows = await db.select().from(alternativesTable);
	// ponytail: jsonb returns unknown, parse to AlternativeImage
	const alternatives = rows.map((a) => ({
		...a,
		img: a.img ? alternativeImageSchema.parse(a.img) : null
	}));
	const total = alternatives.length;
	const activeCount = alternatives.filter((a) => a.isActive).length;
	const categories = [...new Set(alternatives.map((a) => a.category).filter(Boolean))] as string[];

	return {
		alternatives,
		total,
		activeCount,
		categories
	};
}
