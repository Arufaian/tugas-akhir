import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	alternativesTable,
	calculationResultsTable
} from '$lib/server/db/schema/index.js';
import type { AlternativeImage } from '$lib/server/db/schema/alternative.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function DELETE({ params, locals }) {
	const idResult = z.uuid().safeParse(params.id);
	if (!idResult.success) return json({ message: 'ID tidak valid' }, { status: 400 });

	try {
		const result = await db.transaction(async (tx) => {
			const [alternative] = await tx
				.select({ id: alternativesTable.id, img: alternativesTable.img })
				.from(alternativesTable)
				.where(eq(alternativesTable.id, idResult.data))
				.for('update')
				.limit(1);

			if (!alternative) return { status: 'not_found' } as const;

			const [existingValue] = await tx
				.select({ id: alternativeCriterionValuesTable.id })
				.from(alternativeCriterionValuesTable)
				.where(eq(alternativeCriterionValuesTable.alternativeId, idResult.data))
				.limit(1);

			if (existingValue) return { status: 'used_value' } as const;

			const [existingCalculation] = await tx
				.select({ id: calculationResultsTable.id })
				.from(calculationResultsTable)
				.where(eq(calculationResultsTable.alternativeId, idResult.data))
				.limit(1);

			if (existingCalculation) return { status: 'used_calculation' } as const;

			await tx.delete(alternativesTable).where(eq(alternativesTable.id, idResult.data));

			return {
				status: 'deleted',
				imagePath: (alternative.img as AlternativeImage | null)?.path ?? null
			} as const;
		});

		if (result.status === 'not_found') {
			return json({ message: 'Alternatif tidak ditemukan' }, { status: 404 });
		}
		if (result.status === 'used_value') {
			return json({ message: 'Alternatif sudah digunakan pada nilai kriteria' }, { status: 409 });
		}
		if (result.status === 'used_calculation') {
			return json(
				{ message: 'Alternatif sudah digunakan pada histori perhitungan' },
				{ status: 409 }
			);
		}

		if (result.imagePath) {
			// ponytail: best-effort cleanup; add retries only if orphaned files become measurable.
			try {
				const { error } = await locals.supabase.storage
					.from('tugas-akhir')
					.remove([result.imagePath]);
				if (error) console.warn('Gagal menghapus gambar dari storage:', error);
			} catch (err) {
				console.warn('Gagal menghapus gambar dari storage:', err);
			}
		}

		return json({ success: true });
	} catch (err) {
		console.error('Gagal menghapus alternatif:', err);
		return json({ message: 'Gagal menghapus alternatif' }, { status: 500 });
	}
}
