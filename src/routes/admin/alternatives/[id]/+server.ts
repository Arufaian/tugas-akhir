import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { alternativesTable } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function DELETE({ params, locals }) {
	try {
		const { id } = params;

		const idResult = z.string().uuid().safeParse(id);
		if (!idResult.success) {
			return json({ message: 'ID tidak valid' }, { status: 400 });
		}

		const [alternative] = await db
			.select()
			.from(alternativesTable)
			.where(eq(alternativesTable.id, id))
			.limit(1);

		if (!alternative) {
			return json({ message: 'Alternatif tidak ditemukan' }, { status: 404 });
		}

		if (alternative.img?.path) {
			try {
				await locals.supabase.storage.from('tugas-akhir').remove([alternative.img.path]);
			} catch (err) {
				console.warn('Gagal menghapus gambar dari storage:', err);
			}
		}

		await db.delete(alternativesTable).where(eq(alternativesTable.id, id));

		return json({ success: true });
	} catch (err) {
		console.error('Gagal menghapus alternatif:', err);
		return json({ message: 'Gagal menghapus alternatif' }, { status: 500 });
	}
}
