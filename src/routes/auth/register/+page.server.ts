import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { registerSchema } from '$lib/validations/register.schema.js';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(registerSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(registerSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const { name, email, password } = form.data;

		const { error } = await event.locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${event.url.origin}/confirm`,
				data: {
					full_name: name
				}
			}
		});

		if (error) {
			return message(
				form,
				{
					type: 'error',
					text: error.message || 'Gagal mendaftar. Silakan coba lagi.'
				},
				{
					status: 400
				}
			);
		}

		return message(form, {
			type: 'success',
			text: 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.'
		});
	}
};
