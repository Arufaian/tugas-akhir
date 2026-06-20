import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateAlternativeSchema } from '$lib/validations/alternative.schema.js';
import { db } from '$lib/server/db/index.js';
import { alternativesTable } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [alternative] = await db
		.select()
		.from(alternativesTable)
		.where(eq(alternativesTable.id, params.id))
		.limit(1);

	if (!alternative) {
		redirect(303, '/admin/alternatives');
	}

	const form = await superValidate(
		{
			name: alternative.name,
			category: alternative.category ?? '',
			img: alternative.img ? JSON.stringify(alternative.img) : '',
			isActive: alternative.isActive
		},
		zod4(updateAlternativeSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(updateAlternativeSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const data: Record<string, unknown> = {
				name: form.data.name,
				category: form.data.category || null,
				img: form.data.img ? JSON.parse(form.data.img) : null,
				updatedAt: new Date(),
				isActive: form.data.isActive ? true : false
			};

			await db.update(alternativesTable).set(data).where(eq(alternativesTable.id, event.params.id));
		} catch (error) {
			const messageText = error instanceof Error ? error.message : 'Gagal menyimpan data';

			return message(form, { type: 'error', text: messageText }, { status: 500 });
		}

		return message(form, {
			type: 'success',
			text: 'Alternatif berhasil diperbarui'
		});
	}
};
