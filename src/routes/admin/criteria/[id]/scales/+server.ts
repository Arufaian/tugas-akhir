import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '$lib/server/db/index.js';
import { criterionScalesTable } from '$lib/server/db/schema/index.js';

const statusSchema = z.object({ scaleId: z.uuid(), isActive: z.boolean() });

export async function PATCH({ params, request }) {
	const criterionId = z.uuid().safeParse(params.id);
	const status = statusSchema.safeParse(await request.json().catch(() => null));
	if (!criterionId.success || !status.success) {
		return json({ message: 'Status skala tidak valid' }, { status: 400 });
	}

	try {
		const result = await db.transaction(async (tx) => {
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

			if (!scale) return false;

			await tx
				.update(criterionScalesTable)
				.set({ isActive: status.data.isActive, updatedAt: new Date() })
				.where(eq(criterionScalesTable.id, scale.id));

			return true;
		});

		if (!result) return json({ message: 'Skala tidak ditemukan' }, { status: 404 });
		return json({ success: true, isActive: status.data.isActive });
	} catch {
		return json({ message: 'Gagal mengubah status skala' }, { status: 500 });
	}
}
