import { redirect } from '@sveltejs/kit';
import { profilesTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (session && user) {
		const [profile] = await db
			.select({ role: profilesTable.role })
			.from(profilesTable)
			.where(eq(profilesTable.id, user.id))
			.limit(1);
		if (profile?.role === 'admin') {
			throw redirect(303, '/admin/dashboard');
		}
		throw redirect(303, '/');
	}
};
