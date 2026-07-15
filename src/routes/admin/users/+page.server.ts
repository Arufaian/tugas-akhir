import { error, fail } from '@sveltejs/kit';
import { inArray } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { db } from '$lib/server/db/index.js';
import { profilesTable } from '$lib/server/db/schema/index.js';
import { supabaseAdmin } from '$lib/server/supabase-admin.js';
import { registerSchema } from '$lib/validations/register.schema.js';

import type { Actions, PageServerLoad } from './$types.js';
import type { UserRow } from './types.js';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const { user: currentUser } = await locals.safeGetSession();
		const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers({
			page: 1,
			perPage: 1000
		});

		if (authError || data.total > data.users.length) error(500, 'Gagal memuat pengguna.');

		const profileRows = data.users.length
			? await db
					.select({ id: profilesTable.id, name: profilesTable.name, role: profilesTable.role })
					.from(profilesTable)
					.where(
						inArray(
							profilesTable.id,
							data.users.map((user) => user.id)
						)
					)
			: [];
		const profiles = new Map(profileRows.map((profile) => [profile.id, profile]));
		const now = Date.now();
		const users: UserRow[] = data.users
			.map((user) => {
				const profile = profiles.get(user.id);
				const metadataName = user.user_metadata.full_name;

				return {
					id: user.id,
					name: profile?.name ?? (typeof metadataName === 'string' ? metadataName : 'Tanpa nama'),
					email: user.email ?? 'Email tidak tersedia',
					// ponytail: the auth trigger creates sales profiles; keep legacy orphans manageable.
					role: profile?.role ?? 'sales',
					isActive: !user.banned_until || Date.parse(user.banned_until) <= now,
					createdAt: user.created_at,
					isCurrentUser: user.id === currentUser?.id
				};
			})
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
		const active = users.filter((user) => user.isActive).length;

		return {
			users,
			summary: { total: users.length, active, inactive: users.length - active },
			form: await superValidate(zod4(registerSchema))
		};
	} catch {
		error(500, 'Gagal memuat pengguna.');
	}
};

export const actions: Actions = {
	create: async (event) => {
		const form = await superValidate(event, zod4(registerSchema));

		if (!form.valid) {
			form.data.password = '';
			form.data.confirmPassword = '';
			return fail(400, { form });
		}

		const { name, email, password } = form.data;
		form.data.password = '';
		form.data.confirmPassword = '';

		let authError;

		try {
			({ error: authError } = await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: { full_name: name }
			}));
		} catch {
			return message(
				form,
				{ type: 'error', text: 'Gagal menambahkan pengguna. Silakan coba lagi.' },
				{ status: 500 }
			);
		}

		if (authError) {
			const duplicateEmail = ['email_exists', 'user_already_exists'].includes(authError.code ?? '');

			return message(
				form,
				{
					type: 'error',
					text: duplicateEmail
						? 'Email sudah digunakan.'
						: 'Gagal menambahkan pengguna. Silakan coba lagi.'
				},
				{ status: duplicateEmail ? 409 : 500 }
			);
		}

		return message(form, {
			type: 'success',
			text: 'Pengguna berhasil ditambahkan.'
		});
	}
};
