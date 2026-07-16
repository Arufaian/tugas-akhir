export type MockAlternative = {
	id: string;
	code: string;
	name: string;
	category: string;
	price: number;
	optimizationScore: number;
	imageUrl?: string;
};

export const mockAlternatives: MockAlternative[] = [
	{
		id: 'a1',
		code: 'A1',
		name: 'Grand Filano Hybrid Neo',
		category: 'Classy',
		price: 28_315_000,
		optimizationScore: 0.174821,
		imageUrl:
			'https://shsohgijxglfocvwcdjf.supabase.co/storage/v1/object/public/tugas-akhir/alternative-image/1784004149211-85879a42-bd66-40be-9e4d-d061e9fc9ccb.png'
	},
	{
		id: 'a3',
		code: 'A3',
		name: 'Fazzio Hybrid',
		category: 'Classy',
		price: 22_270_000,
		optimizationScore: 0.181352,
		imageUrl:
			'https://shsohgijxglfocvwcdjf.supabase.co/storage/v1/object/public/tugas-akhir/alternative-image/1783946699707-5aaf5915-894f-46f6-839a-92fe5a6cce4b.png'
	},
	{
		id: 'a6',
		code: 'A6',
		name: 'Gear 125',
		category: 'Matic',
		price: 19_195_000,
		optimizationScore: 0.185946
	},
	{
		id: 'a10',
		code: 'A10',
		name: 'XMAX Connected',
		category: 'MAXi',
		price: 68_215_000,
		optimizationScore: 0.148612
	},
	{
		id: 'a23',
		code: 'A23',
		name: 'MX King 150',
		category: 'Moped',
		price: 28_125_000,
		optimizationScore: 0.177984
	},
	{
		id: 'a24',
		code: 'A24',
		name: 'All New XSR 155',
		category: 'Sport',
		price: 39_265_000,
		optimizationScore: 0.188472
	},
	{
		id: 'a25',
		code: 'A25',
		name: 'WR 155 R',
		category: 'Off-Road',
		price: 40_275_000,
		optimizationScore: 0.169225
	},
	{
		id: 'a29',
		code: 'A29',
		name: 'Gear 125 Ultima Hybrid',
		category: 'Matic',
		price: 20_140_000,
		optimizationScore: 0.183216
	}
];

export function filterAlternatives(
	alternatives: MockAlternative[],
	category: string,
	priceRange: number[]
): MockAlternative[] {
	const [minimum, maximum] = priceRange;

	return alternatives.filter(
		(alternative) =>
			(category === 'all' || alternative.category === category) &&
			alternative.price >= minimum &&
			alternative.price <= maximum
	);
}

export function rankAlternatives(alternatives: MockAlternative[]): MockAlternative[] {
	return [...alternatives].sort(
		(a, b) => b.optimizationScore - a.optimizationScore || a.code.localeCompare(b.code)
	);
}
