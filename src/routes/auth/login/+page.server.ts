import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { loginSchema } from '$lib/validations/login.schema.js';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db/index.js';
import { profilesTable } from '$lib/server/db/schema/profile.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(loginSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const { email, password } = form.data;

		const { error } = await event.locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return message(
				form,
				{
					type: 'error',
					text: error.message || 'Gagal sign in. Silakan coba lagi.'
				},
				{
					status: 400
				}
			);
		}

		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();

		const [profile] = await db
			.select({ role: profilesTable.role })
			.from(profilesTable)
			.where(eq(profilesTable.id, user!.id))
			.limit(1);

		return message(form, {
			type: 'success',
			text: 'Sign in berhasil!',
			role: profile?.role
		});
	}
};
