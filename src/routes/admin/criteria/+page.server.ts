import { db } from '$lib/server/db';
import { criteriaTable, criterionScalesTable } from '$lib/server/db/schema';
import { asc, count, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { recalcNormalizedWeights } from '$lib/utils/normalize.js';

export async function load() {
	const rows = await db.select().from(criteriaTable).orderBy(asc(criteriaTable.orderIndex));
	const scaleCounts = await db
		.select({ criterionId: criterionScalesTable.criterionId, count: count() })
		.from(criterionScalesTable)
		.where(eq(criterionScalesTable.isActive, true))
		.groupBy(criterionScalesTable.criterionId);
	const scaleCountMap = new Map(scaleCounts.map((r) => [r.criterionId, r.count]));
	const criteria = rows.map((r) => ({ ...r, scaleCount: scaleCountMap.get(r.id) ?? 0 }));
	const activeRows = rows.filter((r) => r.isActive);

	const total = rows.length;
	const benefitCount = rows.filter((c) => c.type === 'benefit').length;
	const costCount = rows.filter((c) => c.type === 'cost').length;
	const scaleCriteriaCount = criteria.filter((c) => c.inputType === 'scale').length;
	const emptyScaleCriteriaCount = criteria.filter(
		(c) => c.inputType === 'scale' && c.scaleCount === 0
	).length;

	// ponytail: MOORA only uses active criteria; inactive rows must not stale the indicator.
	const normalizedSum = activeRows.reduce((s, r) => s + Number(r.normalizedWeight), 0);
	const hasZeroWeight = activeRows.some((r) => Number(r.normalizedWeight) === 0);
	const needsNormalization = Math.abs(normalizedSum - 1) > 0.0001 || hasZeroWeight;

	return {
		criteria,
		total,
		benefitCount,
		costCount,
		normalizedSum,
		needsNormalization,
		scaleCriteriaCount,
		emptyScaleCriteriaCount
	};
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
				.set({ normalizedWeight: r.normalizedWeight.toFixed(9), updatedAt: new Date() })
				.where(eq(criteriaTable.id, r.id));
		}

		return { success: true };
	}
};
