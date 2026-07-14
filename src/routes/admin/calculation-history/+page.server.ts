import { error } from '@sveltejs/kit';
import { z } from 'zod';

import { getCalculationHistoryPage } from '$lib/server/services/moora-history.js';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const pageResult = z.coerce
		.number()
		.int()
		.positive()
		.safeParse(url.searchParams.get('page') ?? '1');

	try {
		return await getCalculationHistoryPage(pageResult.success ? pageResult.data : 1);
	} catch {
		error(500, 'Riwayat perhitungan gagal dimuat');
	}
};
