import { error } from '@sveltejs/kit';
import { z } from 'zod';

import type { PageServerLoad } from './$types.js';
import { getMockCalculationRun } from '../mock-data.js';

export const load: PageServerLoad = ({ params }) => {
	if (!z.uuid().safeParse(params.id).success) error(404, 'Riwayat perhitungan tidak ditemukan');

	const detail = getMockCalculationRun(params.id);
	if (!detail) error(404, 'Riwayat perhitungan tidak ditemukan');

	return detail;
};
