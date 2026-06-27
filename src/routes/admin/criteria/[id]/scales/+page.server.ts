import { error, fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db/index.js';
import { criteriaTable, criterionScalesTable } from '$lib/server/db/schema/index.js';
import { eq, asc, sql } from 'drizzle-orm';
import { createCriterionScaleSchema } from '$lib/validations/criterion-scale.schema.js';

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
		criterion: criterion,
		form: await superValidate(zod4(createCriterionScaleSchema))
	};
}

export const actions = {
	create: async (event) => {
		const form = await superValidate(event, zod4(createCriterionScaleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const [nextOrder] = await db
				.select({
					max: sql<number>`COALESCE(MAX(${criterionScalesTable.orderIndex}), 0) + 1`
				})
				.from(criterionScalesTable)
				.where(eq(criterionScalesTable.criterionId, event.params.id));

			await db.insert(criterionScalesTable).values({
				criterionId: event.params.id,
				label: form.data.label,
				value: String(form.data.value),
				description: form.data.description ?? null,
				orderIndex: nextOrder.max
			});
		} catch (err) {
			const isUniqueViolation = (err as { cause?: { code?: string } })?.cause?.code === '23505';
			const messageText = isUniqueViolation
				? `Nilai "${form.data.value}" sudah ada`
				: err instanceof Error
					? err.message
					: 'Gagal menyimpan skala';
			return message(
				form,
				{ type: 'error', text: messageText },
				{ status: isUniqueViolation ? 409 : 500 }
			);
		}

		return message(form, { type: 'success', text: 'Skala berhasil ditambahkan' });
	}
};
