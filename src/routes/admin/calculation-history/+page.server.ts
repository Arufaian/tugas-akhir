import type { PageServerLoad } from './$types.js';
import { getMockCalculationHistory } from './mock-data.js';

export const load: PageServerLoad = ({ url }) => {
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

	return getMockCalculationHistory(page, url.searchParams.get('mock') === 'empty');
};
