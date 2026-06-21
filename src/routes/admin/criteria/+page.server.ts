import { db } from '$lib/server/db';
import { criteriaTable } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function load() {
	const rows = await db.select().from(criteriaTable).orderBy(asc(criteriaTable.orderIndex));

	const total = rows.length;
	const benefitCount = rows.filter((c) => c.type === 'benefit').length;
	const costCount = rows.filter((c) => c.type === 'cost').length;

	return { criteria: rows, total, benefitCount, costCount };
}
