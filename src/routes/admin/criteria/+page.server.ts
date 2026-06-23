import { db } from '$lib/server/db';
import { criteriaTable } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { recalcNormalizedWeights } from '$lib/utils/normalize.js';

export async function load() {
	const rows = await db.select().from(criteriaTable).orderBy(asc(criteriaTable.orderIndex));

	const total = rows.length;
	const benefitCount = rows.filter((c) => c.type === 'benefit').length;
	const costCount = rows.filter((c) => c.type === 'cost').length;

	// ponytail: sum check — sum should be ~1.0, pulse button if stale
	const normalizedSum = rows.reduce((s, r) => s + Number(r.normalizedWeight), 0);
	const hasZeroWeight = rows.some((r) => r.isActive && Number(r.normalizedWeight) === 0);
	const needsNormalization = Math.abs(normalizedSum - 1) > 0.0001 || hasZeroWeight;

	return { criteria: rows, total, benefitCount, costCount, needsNormalization };
}

export const actions = {
	normalize: async () => {
		const rows = await db
			.select({
				id: criteriaTable.id,
				rawWeight: criteriaTable.rawWeight,
				isActive: criteriaTable.isActive
			})
			.from(criteriaTable);

		if (rows.length === 0) return fail(400, { error: 'Belum ada kriteria' });
		if (!rows.some((r) => r.isActive)) return fail(400, { error: 'Tidak ada kriteria aktif' });

		const result = recalcNormalizedWeights(
			rows.map((r) => ({ ...r, rawWeight: Number(r.rawWeight) }))
		);

		for (const r of result) {
			await db
				.update(criteriaTable)
				.set({ normalizedWeight: r.normalizedWeight.toFixed(9) })
				.where(eq(criteriaTable.id, r.id));
		}

		return { success: true };
	}
};
