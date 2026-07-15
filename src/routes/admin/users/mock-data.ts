import type { UserRow } from './types.js';

// ponytail: temporary UI fixture; replace with Supabase Auth users after the layout is approved.
export const mockUsers: UserRow[] = [
	{
		id: '10d83d4e-253e-4680-a4ea-c5ef6bb58c91',
		name: 'Arufian Rahman',
		email: 'arufian.rahman@example.com',
		role: 'admin',
		isActive: true,
		createdAt: '2026-07-15T08:30:00.000Z',
		isCurrentUser: true
	},
	{
		id: '2b851a1e-f116-4696-b9a8-cf16bbbd2703',
		name: 'Budi Santoso',
		email: 'budi.santoso@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-07-14T03:20:00.000Z',
		isCurrentUser: false
	},
	{
		id: '36ebecb8-462b-41b7-a727-dc8e0c704039',
		name: 'Citra Lestari',
		email: 'citra.lestari@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-07-12T10:00:00.000Z',
		isCurrentUser: false
	},
	{
		id: '45b54880-ed51-4a57-8820-e6ae054a7d10',
		name: 'Dimas Pratama Wijaya',
		email: 'dimas.pratama.wijaya@example.com',
		role: 'sales',
		isActive: false,
		createdAt: '2026-07-10T07:45:00.000Z',
		isCurrentUser: false
	},
	{
		id: '52c268c8-f112-4eea-9b23-fbaeb2d11fd8',
		name: 'Eka Nurhayati',
		email: 'eka.nurhayati@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-07-08T02:15:00.000Z',
		isCurrentUser: false
	},
	{
		id: '63da3e18-3a31-43c7-8de8-55a15556f8a5',
		name: 'Fajar Hidayat',
		email: 'fajar.hidayat@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-07-05T05:10:00.000Z',
		isCurrentUser: false
	},
	{
		id: '73b5b284-17c7-4668-a28c-e97fccb2ef75',
		name: 'Gita Maharani',
		email: 'gita.maharani@example.com',
		role: 'sales',
		isActive: false,
		createdAt: '2026-07-01T09:25:00.000Z',
		isCurrentUser: false
	},
	{
		id: '8c251873-1683-4b32-85ea-65a1d22d3919',
		name: 'Hendra Kurniawan',
		email: 'hendra.kurniawan@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-06-28T04:40:00.000Z',
		isCurrentUser: false
	},
	{
		id: '91dbb420-0087-45ec-b6e4-8474a5921682',
		name: 'Intan Permatasari',
		email: 'intan.permatasari.sales@example.com',
		role: 'sales',
		isActive: true,
		createdAt: '2026-06-24T06:00:00.000Z',
		isCurrentUser: false
	}
];
