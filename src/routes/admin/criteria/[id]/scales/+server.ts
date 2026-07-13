import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '$lib/server/db/index.js';
import { criteriaTable, criterionScalesTable } from '$lib/server/db/schema/index.js';

const statusSchema = z.object({ scaleId: z.uuid(), isActive: z.boolean() });

export async function PATCH({ params, request }) {
	const criterionId = z.uuid().safeParse(params.id);
	const status = statusSchema.safeParse(await request.json().catch(() => null));
	if (!criterionId.success || !status.success) {
		return json({ message: 'Status skala tidak valid' }, { status: 400 });
	}

	try {
		const result = await db.transaction(async (tx) => {
			const [criterion] = await tx
				.select({ inputType: criteriaTable.inputType })
				.from(criteriaTable)
				.where(eq(criteriaTable.id, criterionId.data))
				.for('update')
				.limit(1);

			if (!criterion) return 'criterion_not_found';
			if (criterion.inputType !== 'scale') return 'invalid_parent';

			const [scale] = await tx
				.select({ id: criterionScalesTable.id })
				.from(criterionScalesTable)
				.where(
					and(
						eq(criterionScalesTable.id, status.data.scaleId),
						eq(criterionScalesTable.criterionId, criterionId.data)
					)
				)
				.for('update')
				.limit(1);

			if (!scale) return 'not_found';

			await tx
				.update(criterionScalesTable)
				.set({ isActive: status.data.isActive, updatedAt: new Date() })
				.where(eq(criterionScalesTable.id, scale.id));

			return 'updated';
		});

		if (result === 'criterion_not_found') {
			return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });
		}
		if (result === 'not_found') return json({ message: 'Skala tidak ditemukan' }, { status: 404 });
		if (result === 'invalid_parent') {
			return json(
				{ message: 'Skala hanya dapat dikelola untuk kriteria bertipe skala' },
				{ status: 409 }
			);
		}
		return json({ success: true, isActive: status.data.isActive });
	} catch {
		return json({ message: 'Gagal mengubah status skala' }, { status: 500 });
	}
}
