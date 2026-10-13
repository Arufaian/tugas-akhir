import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '$lib/server/db/index.js';
import { profilesTable } from '$lib/server/db/schema/index.js';
import { supabaseAdmin } from '$lib/server/supabase-admin.js';

import type { RequestHandler } from './$types.js';

const updateSchema = z
	.object({
		id: z.uuid(),
		isActive: z.boolean().optional(),
		role: z.enum(['admin']).optional()
	})
	.refine((data) => data.isActive !== undefined || data.role !== undefined, {
		message: 'Data pembaruan tidak valid.'
	});

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const result = updateSchema.safeParse({
		id: params.id,
		...(await request.json().catch(() => ({})))
	});

	if (!result.success) error(400, 'Data pembaruan tidak valid.');

	if (result.data.role) {
		await db
			.update(profilesTable)
			.set({ role: result.data.role })
			.where(eq(profilesTable.id, result.data.id))
			.catch(() => error(500, 'Gagal memperbarui role pengguna.'));
	}

	if (result.data.isActive !== undefined) {
		const { user } = await locals.safeGetSession();
		if (user?.id === result.data.id && !result.data.isActive) {
			error(403, 'Akun yang sedang digunakan tidak dapat dinonaktifkan.');
		}

		const { error: authError } = await supabaseAdmin.auth.admin
			.updateUserById(result.data.id, {
				ban_duration: result.data.isActive ? 'none' : '876000h'
			})
			.catch(() => error(500, 'Gagal mengubah status pengguna.'));

		if (authError?.code === 'user_not_found') error(404, 'Pengguna tidak ditemukan.');
		if (authError) error(500, 'Gagal mengubah status pengguna.');
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const idResult = z.uuid().safeParse(params.id);
	if (!idResult.success) error(400, 'ID pengguna tidak valid.');

	const [profile] = await db
		.select({ role: profilesTable.role })
		.from(profilesTable)
		.where(eq(profilesTable.id, idResult.data))
		.limit(1)
		.catch(() => error(500, 'Gagal menghapus pengguna.'));

	if (profile?.role === 'admin') error(403, 'Akun admin tidak dapat dihapus.');

	// ponytail: Supabase enforces Storage ownership; do not duplicate that check here.
	const { error: authError } = await supabaseAdmin.auth.admin
		.deleteUser(idResult.data)
		.catch(() => error(500, 'Gagal menghapus pengguna.'));

	if (authError?.code === 'user_not_found') error(404, 'Pengguna tidak ditemukan.');
	if (authError) error(500, 'Gagal menghapus pengguna.');

	return json({ success: true });
};
