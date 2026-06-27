import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { criteriaTable, criterionScalesTable } from '$lib/server/db/schema/index.js';
import { eq, asc } from 'drizzle-orm';

export async function load({ params }) {
	const { id } = params;

	const [criterion] = await db
		.select({ name: criteriaTable.name })
		.from(criteriaTable)
		.where(eq(criteriaTable.id, id))
		.limit(1);

	if (!criterion) error(404, 'Kriteria tidak ditemukan');

	const scales = await db
		.select()
		.from(criterionScalesTable)
		.where(eq(criterionScalesTable.criterionId, id))
		.orderBy(asc(criterionScalesTable.orderIndex));

	return {
		scales: scales.map((s) => ({ ...s, value: Number(s.value) })),
		criterion: criterion
	};
}
