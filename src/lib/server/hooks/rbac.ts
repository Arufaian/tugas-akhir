import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '../db';
import { profilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

type Role = 'admin' | 'sales';

const protectedRoutes = [{ path: '/admin', roles: ['admin'] }];

export const handleRbac: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const route = protectedRoutes.find(
		(r) => pathname === r.path || pathname.startsWith(`${r.path}/`)
	);

	if (route) {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			throw redirect(303, '/auth/login');
		}

		const [profile] = await db
			.select({ role: profilesTable.role })
			.from(profilesTable)
			.where(eq(profilesTable.id, user.id))
			.limit(1);

		const role = profile?.role as Role | undefined;

		if (!role || !route.roles.includes(role)) {
			throw redirect(303, '/');
		}

		event.locals.role = role;
	}

	return resolve(event);
};
