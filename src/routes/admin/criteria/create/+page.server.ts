import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db/index.js';
import { criteriaTable } from '$lib/server/db/schema/index.js';
import { sql } from 'drizzle-orm';
import { createCriterionSchema } from '$lib/validations/criterion.schema.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(createCriterionSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(createCriterionSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const [result] = await db
				.select({
					maxCodeNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(${criteriaTable.code} FROM 2) AS INTEGER)), 0)`,
					maxOrder: sql<number>`COALESCE(MAX(${criteriaTable.orderIndex}), 0)`
				})
				.from(criteriaTable);

			const nextNumber = result.maxCodeNum + 1;
			const code = `C${nextNumber}`;
			const orderIndex = result.maxOrder + 1;

			await db.insert(criteriaTable).values({
				code,
				name: form.data.name,
				description: form.data.description || null,
				unit: form.data.unit,
				rawWeight: form.data.rawWeight,
				normalizedWeight: '0',
				type: form.data.type,
				inputType: form.data.inputType,
				orderIndex
			});
		} catch (error) {
			const messageText = error instanceof Error ? error.message : 'Gagal menyimpan data';

			return message(form, { type: 'error', text: messageText }, { status: 500 });
		}

		return message(form, {
			type: 'success',
			text: 'Kriteria berhasil ditambahkan'
		});
	}
};
