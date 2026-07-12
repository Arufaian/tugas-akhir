import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { alternativeCriterionValuesTable, criteriaTable } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function DELETE({ params }) {
	try {
		const { id } = params;
		const idResult = z.uuid().safeParse(id);
		if (!idResult.success) return json({ message: 'ID tidak valid' }, { status: 400 });

		const result = await db.transaction(async (tx) => {
			const [criterion] = await tx
				.select({ id: criteriaTable.id })
				.from(criteriaTable)
				.where(eq(criteriaTable.id, id))
				.for('update')
				.limit(1);

			if (!criterion) return 'not_found';

			const [existingValue] = await tx
				.select({ id: alternativeCriterionValuesTable.id })
				.from(alternativeCriterionValuesTable)
				.where(eq(alternativeCriterionValuesTable.criterionId, id))
				.limit(1);

			if (existingValue) return 'used';

			await tx.delete(criteriaTable).where(eq(criteriaTable.id, id));
		});

		if (result === 'not_found') {
			return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });
		}
		if (result === 'used') {
			return json({ message: 'Kriteria sudah digunakan pada nilai alternatif' }, { status: 409 });
		}

		return json({ success: true });
	} catch {
		return json({ message: 'Gagal menghapus kriteria' }, { status: 500 });
	}
}
