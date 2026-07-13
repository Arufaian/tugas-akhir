import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateCriterionSchema } from '$lib/validations/criterion.schema.js';
import { db } from '$lib/server/db/index.js';
import {
	alternativeCriterionValuesTable,
	criteriaTable,
	criterionScalesTable
} from '$lib/server/db/schema/index.js';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [criterion] = await db
		.select()
		.from(criteriaTable)
		.where(eq(criteriaTable.id, params.id))
		.limit(1);

	if (!criterion) {
		redirect(303, '/admin/criteria');
	}

	// ponytail: DB stores numeric as "4.0000", schema expects "4"
	const rawWeight = String(Number(criterion.rawWeight));

	const form = await superValidate(
		{
			name: criterion.name,
			description: criterion.description ?? '',
			unit: criterion.unit,
			rawWeight,
			type: criterion.type,
			inputType: criterion.inputType
		},
		zod4(updateCriterionSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(updateCriterionSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const data: Record<string, unknown> = {
				name: form.data.name,
				description: form.data.description || null,
				unit: form.data.unit,
				rawWeight: form.data.rawWeight,
				type: form.data.type,
				inputType: form.data.inputType,
				normalizedWeight: '0',
				updatedAt: new Date()
			};

			const result = await db.transaction(async (tx) => {
				const [criterion] = await tx
					.select({ inputType: criteriaTable.inputType })
					.from(criteriaTable)
					.where(eq(criteriaTable.id, event.params.id))
					.for('update')
					.limit(1);

				if (!criterion) return 'not_found';

				if (criterion.inputType !== form.data.inputType) {
					const [existingValue] = await tx
						.select({ id: alternativeCriterionValuesTable.id })
						.from(alternativeCriterionValuesTable)
						.where(eq(alternativeCriterionValuesTable.criterionId, event.params.id))
						.limit(1);

					if (existingValue) return 'has_values';

					if (criterion.inputType === 'scale') {
						const [activeScale] = await tx
							.select({ id: criterionScalesTable.id })
							.from(criterionScalesTable)
							.where(
								and(
									eq(criterionScalesTable.criterionId, event.params.id),
									eq(criterionScalesTable.isActive, true)
								)
							)
							.limit(1);

						if (activeScale) return 'has_active_scales';
					}
				}

				await tx.update(criteriaTable).set(data).where(eq(criteriaTable.id, event.params.id));
			});

			if (result === 'not_found') {
				return message(form, { type: 'error', text: 'Kriteria tidak ditemukan' }, { status: 404 });
			}
			if (result === 'has_values') {
				return message(
					form,
					{
						type: 'error',
						text: 'Tipe input tidak dapat diubah karena kriteria sudah memiliki nilai alternatif'
					},
					{ status: 409 }
				);
			}
			if (result === 'has_active_scales') {
				return message(
					form,
					{
						type: 'error',
						text: 'Tipe input tidak dapat diubah selama skala aktif masih tersedia'
					},
					{ status: 409 }
				);
			}
		} catch (error) {
			const dbError = error as {
				code?: string;
				constraint_name?: string;
				cause?: { code?: string; constraint_name?: string };
			};
			const isTechFeaturesConflict =
				(dbError.code ?? dbError.cause?.code) === '23505' &&
				(dbError.constraint_name ?? dbError.cause?.constraint_name) ===
					'uq_criteria_single_tech_features';
			const messageText = isTechFeaturesConflict
				? 'Kriteria fitur teknologi hanya boleh ada satu'
				: error instanceof Error
					? error.message
					: 'Gagal menyimpan data';

			return message(
				form,
				{ type: 'error', text: messageText },
				{ status: isTechFeaturesConflict ? 409 : 500 }
			);
		}

		return message(form, {
			type: 'success',
			text: 'Kriteria berhasil diperbarui'
		});
	}
};
