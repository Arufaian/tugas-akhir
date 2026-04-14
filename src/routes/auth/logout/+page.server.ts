import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async (events) => {
		const { error } = await events.locals.supabase.auth.signOut();

		if (error) {
			console.error(error);
			return fail(500, { message: 'Gagal logout, silakan coba lagi.' });
		}

		redirect(303, '/auth/login');
	}
} satisfies Actions;
