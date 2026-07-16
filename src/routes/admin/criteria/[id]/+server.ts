import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	calculationDetailsTable,
	criteriaTable
} from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const statusSchema = z.object({ isActive: z.boolean() });

export async function PATCH({ params, request }) {
	const idResult = z.uuid().safeParse(params.id);
	if (!idResult.success) return json({ message: 'ID tidak valid' }, { status: 400 });

	const statusResult = statusSchema.safeParse(await request.json().catch(() => null));
	if (!statusResult.success) return json({ message: 'Status tidak valid' }, { status: 400 });

	try {
		const [existingCriterion] = await db
			.select({ id: criteriaTable.id, isPrice: criteriaTable.isPrice })
			.from(criteriaTable)
			.where(eq(criteriaTable.id, idResult.data))
			.limit(1);

		if (!existingCriterion) {
			return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });
		}
		if (existingCriterion.isPrice && !statusResult.data.isActive) {
			return json({ message: 'Lepaskan penanda filter harga terlebih dahulu' }, { status: 409 });
		}

		const [criterion] = await db
			.update(criteriaTable)
			.set({ isActive: statusResult.data.isActive, updatedAt: new Date() })
			.where(eq(criteriaTable.id, idResult.data))
			.returning({ id: criteriaTable.id });

		if (!criterion) return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });

		return json({ success: true, isActive: statusResult.data.isActive });
	} catch (error) {
		const dbError = error as {
			code?: string;
			constraint_name?: string;
			cause?: { code?: string; constraint_name?: string };
		};
		if (
			(dbError.code ?? dbError.cause?.code) === '23514' &&
			(dbError.constraint_name ?? dbError.cause?.constraint_name) === 'criteria_price_invariants'
		) {
			return json({ message: 'Lepaskan penanda filter harga terlebih dahulu' }, { status: 409 });
		}

		return json({ message: 'Gagal mengubah status kriteria' }, { status: 500 });
	}
}

export async function DELETE({ params }) {
	try {
		const { id } = params;
		const idResult = z.uuid().safeParse(id);
		if (!idResult.success) return json({ message: 'ID tidak valid' }, { status: 400 });

		const result = await db.transaction(async (tx) => {
			const [criterion] = await tx
				.select({ id: criteriaTable.id, isPrice: criteriaTable.isPrice })
				.from(criteriaTable)
				.where(eq(criteriaTable.id, id))
				.for('update')
				.limit(1);

			if (!criterion) return 'not_found';
			if (criterion.isPrice) return 'price';

			const [existingValue] = await tx
				.select({ id: alternativeCriterionValuesTable.id })
				.from(alternativeCriterionValuesTable)
				.where(eq(alternativeCriterionValuesTable.criterionId, id))
				.limit(1);

			if (existingValue) return 'used_value';

			const [existingCalculation] = await tx
				.select({ id: calculationDetailsTable.id })
				.from(calculationDetailsTable)
				.where(eq(calculationDetailsTable.criterionId, id))
				.limit(1);

			if (existingCalculation) return 'used_calculation';

			await tx.delete(criteriaTable).where(eq(criteriaTable.id, id));
		});

		if (result === 'not_found') {
			return json({ message: 'Kriteria tidak ditemukan' }, { status: 404 });
		}
		if (result === 'used_value') {
			return json({ message: 'Kriteria sudah digunakan pada nilai alternatif' }, { status: 409 });
		}
		if (result === 'price') {
			return json(
				{ message: 'Lepaskan penanda filter harga sebelum menghapus kriteria' },
				{ status: 409 }
			);
		}
		if (result === 'used_calculation') {
			return json(
				{ message: 'Kriteria sudah digunakan pada histori perhitungan' },
				{ status: 409 }
			);
		}

		return json({ success: true });
	} catch {
		return json({ message: 'Gagal menghapus kriteria' }, { status: 500 });
	}
}
