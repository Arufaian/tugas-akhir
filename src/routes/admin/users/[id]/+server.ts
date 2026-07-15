import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

import { supabaseAdmin } from '$lib/server/supabase-admin.js';

import type { RequestHandler } from './$types.js';

const statusSchema = z.object({ id: z.uuid(), isActive: z.boolean() });

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const result = statusSchema.safeParse({
		id: params.id,
		...(await request.json().catch(() => ({})))
	});

	if (!result.success) error(400, 'Data status tidak valid.');

	const { user } = await locals.safeGetSession();
	if (user?.id === result.data.id && !result.data.isActive) {
		error(403, 'Akun yang sedang digunakan tidak dapat dinonaktifkan.');
	}

	const { data, error: authError } = await supabaseAdmin.auth.admin
		.updateUserById(result.data.id, {
			ban_duration: result.data.isActive ? 'none' : '876000h'
		})
		.catch(() => error(500, 'Gagal mengubah status pengguna.'));

	if (authError?.code === 'user_not_found') error(404, 'Pengguna tidak ditemukan.');
	if (authError) error(500, 'Gagal mengubah status pengguna.');

	return json({
		success: true,
		isActive: !data.user.banned_until || Date.parse(data.user.banned_until) <= Date.now()
	});
};
