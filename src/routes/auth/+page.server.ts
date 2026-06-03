import type { PageServerLoad } from '../admin/$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	throw redirect(302, '/auth/login');
};
