import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createAlternativeSchema } from '$lib/validations/alternative.schema.js';
import { db } from '$lib/server/db/index.js';
import { alternativesTable } from '$lib/server/db/schema/index.js';
import { desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(createAlternativeSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(createAlternativeSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let code: string;

		try {
			const [last] = await db
				.select({ code: alternativesTable.code })
				.from(alternativesTable)
				.orderBy(desc(sql`CAST(SUBSTRING(${alternativesTable.code} FROM 2) AS INTEGER)`))
				.limit(1);

			const nextNumber = last ? parseInt(last.code.replace('A', ''), 10) + 1 : 1;
			code = `A${nextNumber}`;

			const data = {
				code,
				name: form.data.name,
				category: form.data.category || null,
				imgUrl: form.data.imgUrl && form.data.imgUrl !== '' ? form.data.imgUrl : null
			};

			await db.insert(alternativesTable).values(data);
		} catch (error) {
			const messageText = error instanceof Error ? error.message : 'Gagal menyimpan data';

			return message(form, { type: 'error', text: messageText }, { status: 500 });
		}

		return message(form, {
			type: 'success',
			text: 'Alternatif berhasil ditambahkan'
		});
	}
};
