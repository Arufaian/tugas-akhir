import { db } from '$lib/server/db';
import { alternativesTable } from '$lib/server/db/schema';

export async function load() {
	const alternatives = await db.select().from(alternativesTable);

	return {
		alternatives
	};
}
