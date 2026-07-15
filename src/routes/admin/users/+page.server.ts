import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { registerSchema } from '$lib/validations/register.schema.js';

import type { Actions, PageServerLoad } from './$types.js';
import { mockUsers } from './mock-data.js';

export const load: PageServerLoad = async () => {
	return {
		users: mockUsers,
		summary: {
			total: mockUsers.length,
			active: mockUsers.filter((user) => user.isActive).length,
			inactive: mockUsers.filter((user) => !user.isActive).length
		},
		form: await superValidate(zod4(registerSchema))
	};
};

export const actions: Actions = {
	create: async (event) => {
		const form = await superValidate(event, zod4(registerSchema));

		if (!form.valid) return fail(400, { form });

		return message(form, {
			type: 'success',
			text: 'Form pengguna valid. Data masih menggunakan mock.'
		});
	}
};
