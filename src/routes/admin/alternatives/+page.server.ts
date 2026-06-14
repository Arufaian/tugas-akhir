import { db } from '$lib/server/db';
import { alternativesTable } from '$lib/server/db/schema';

export async function load() {
	const alternatives = await db.select().from(alternativesTable);
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
