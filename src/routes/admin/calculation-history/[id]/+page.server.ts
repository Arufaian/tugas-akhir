import { error } from '@sveltejs/kit';
import { z } from 'zod';

import { getCalculationRun } from '$lib/server/services/moora-history.js';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	if (!z.uuid().safeParse(params.id).success) error(404, 'Riwayat perhitungan tidak ditemukan');

	let detail;
	try {
		detail = await getCalculationRun(params.id);
	} catch {
		error(500, 'Riwayat perhitungan gagal dimuat');
	}

	if (!detail) error(404, 'Riwayat perhitungan tidak ditemukan');

	return detail;
};
