import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { criteriaTable } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function DELETE({ params }) {
	try {
		const { id } = params;
		const idResult = z.string().uuid().safeParse(id);
		if (!idResult.success) return json({ message: 'ID tidak valid' }, { status: 400 });

		const [criterion] = await db
			.select({ id: criteriaTable.id })
			.from(criteriaTable)
			.where(eq(criteriaTable.id, id))
			.limit(1);

		// ponytail: cascade handles FK cleanup
		if (!criterion) return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });

		await db.delete(criteriaTable).where(eq(criteriaTable.id, id));
		return json({ success: true });
	} catch {
		return json({ message: 'Gagal menghapus kriteria' }, { status: 500 });
	}
}
