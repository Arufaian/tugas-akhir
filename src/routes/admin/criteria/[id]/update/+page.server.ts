import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateCriterionSchema } from '$lib/validations/criterion.schema.js';
import { db } from '$lib/server/db/index.js';
import { criteriaTable } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

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

			await db.update(criteriaTable).set(data).where(eq(criteriaTable.id, event.params.id));
		} catch (error) {
			const messageText = error instanceof Error ? error.message : 'Gagal menyimpan data';

			return message(form, { type: 'error', text: messageText }, { status: 500 });
		}

		return message(form, {
			type: 'success',
			text: 'Kriteria berhasil diperbarui'
		});
	}
};
