import { db } from '../index';
import { alternativesTable } from '../schema';

const alternativesSeed = [
	{ code: 'A1', name: 'Grand Filano Hybrid Neo', category: 'Classy' },
	{ code: 'A2', name: 'Grand Filano Hybrid Lux', category: 'Classy' },
	{ code: 'A3', name: 'FAZZIO HYBRID', category: 'Classy' },
	{ code: 'A4', name: 'FAZZIO HYBRID NEO', category: 'Classy' },
	{ code: 'A5', name: 'FAZZIO HYBRID LUX', category: 'Classy' },
	{ code: 'A6', name: 'GEAR 125', category: 'Matic' },
	{ code: 'A7', name: 'GEAR 125 S-Version', category: 'Matic' },
	{ code: 'A8', name: 'FREEGO 125', category: 'Matic' },
	{ code: 'A9', name: 'FREEGO 125 CONNECTED', category: 'Matic' },
	{ code: 'A10', name: 'X-MAX CONNECTED', category: 'MAXi' },
	{ code: 'A11', name: 'Aerox Alpha', category: 'MAXi' },
	{ code: 'A12', name: 'Aerox Alpha Cybercity', category: 'MAXi' },
	{ code: 'A13', name: 'Aerox Alpha "TURBO"', category: 'MAXi' },
	{ code: 'A14', name: 'Aerox Alpha "TURBO" Ultimate', category: 'MAXi' },
	{ code: 'A15', name: 'All New Aerox 155', category: 'MAXi' },
	{ code: 'A16', name: 'All New Aerox 155 C/ABS', category: 'MAXi' },
	{ code: 'A17', name: 'NMAX "TURBO" NEO', category: 'MAXi' },
	{ code: 'A18', name: 'NMAX "TURBO" NEO S', category: 'MAXi' },
	{ code: 'A19', name: 'NMAX "TURBO"', category: 'MAXi' },
	{ code: 'A20', name: 'NMAX "TURBO" TECH MAX', category: 'MAXi' },
	{ code: 'A21', name: 'NMAX "TURBO" TECH MAX ULTIMATE', category: 'MAXi' },
	{ code: 'A22', name: 'NEW MIO M3 CW', category: 'Matic' },
	{ code: 'A23', name: 'MX King 150', category: 'Moped' },
	{ code: 'A24', name: 'All New XSR 155', category: 'Sport' },
	{ code: 'A25', name: 'WR 155 R', category: 'Off-Road' },
	{ code: 'A26', name: 'LEXI LX 155 CONNECTED', category: 'MAXi' },
	{ code: 'A27', name: 'LEXI LX 155 S CONNECTED', category: 'MAXi' },
	{ code: 'A28', name: 'LEXI LX 155 S CONNECTED ABS', category: 'MAXi' },
	{ code: 'A29', name: 'GEAR 125 ULTIMA HYBRID', category: 'Matic' },
	{ code: 'A30', name: 'GEAR 125 ULTIMA HYBRID S', category: 'Matic' }
];

export async function seedAlternatives(): Promise<void> {
	const values = alternativesSeed.map((a) => ({
		code: a.code,
		name: a.name,
		category: a.category,
		img: { url: 'https://picsum.photos/200', path: null },
		isActive: true
	}));

	await db.insert(alternativesTable).values(values);
	console.log(`Inserted ${values.length} alternatives.`);
}
