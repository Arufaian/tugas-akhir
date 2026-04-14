import type { LayoutServerLoad } from './$types';
import type { UserProfileData } from '$lib/types/user-profile';
import { profilesTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

type AdminLayoutData = {
	profile: UserProfileData | null;
};

export const load: LayoutServerLoad<AdminLayoutData> = async (event) => {
	const { data } = await event.locals.supabase.auth.getUser();
	const user = data.user;

	// Guard 1: User harus ada & email harus ada
	if (!user || !user.email) {
		return { profile: null };
	}

	const [dbProfile] = await db
		.select({
			name: profilesTable.name,
			role: profilesTable.role
		})
		.from(profilesTable)
		.where(eq(profilesTable.id, user.id))
		.limit(1);

	// Guard 2: Profile harus ada di database
	if (!dbProfile) {
		return { profile: null };
	}

	// Guarantee: Semua field ada, email tidak undefined
	const profile: UserProfileData = {
		name: dbProfile.name,
		role: dbProfile.role,
		email: user.email
	};

	return { profile };
};
