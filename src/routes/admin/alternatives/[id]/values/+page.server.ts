import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { alternativeCriterionValuesSchema } from '$lib/validations/alternative-criterion-value.schema.js';

import type { Actions, PageServerLoad } from './$types.js';

const criteria = [
	{
		id: '11111111-1111-4111-8111-111111111111',
		code: 'C1',
		name: 'Harga',
		description: 'Harga jual motor saat ini.',
		unit: 'Rp',
		inputType: 'number' as const,
		scales: []
	},
	{
		id: '22222222-2222-4222-8222-222222222222',
		code: 'C2',
		name: 'Efisiensi bahan bakar',
		description: 'Pilih tingkat efisiensi berdasarkan hasil pengujian.',
		unit: 'skala',
		inputType: 'scale' as const,
		scales: [
			{ label: 'Kurang efisien', value: '1' },
			{ label: 'Cukup efisien', value: '3' },
			{ label: 'Sangat efisien', value: '5' }
		]
	},
	{
		id: '33333333-3333-4333-8333-333333333333',
		code: 'C3',
		name: 'Fitur teknologi',
		description: 'Tandai fitur yang tersedia pada motor.',
		unit: 'poin',
		inputType: 'tech_features' as const,
		scales: []
	}
];

export const load: PageServerLoad = async ({ params }) => ({
	alternative: { id: params.id, code: 'A01', name: 'Yamaha NMAX Turbo' },
	criteria,
	form: await superValidate(
		{
			values: [
				{
					criterionId: criteria[0].id,
					value: '32500000',
					selectedFeatureIds: [],
					isAssessed: false
				},
				{
					criterionId: criteria[1].id,
					value: '3',
					selectedFeatureIds: [],
					isAssessed: false
				},
				{
					criterionId: criteria[2].id,
					value: '',
					selectedFeatureIds: ['abs', 'smart-key', 'y-connect'],
					isAssessed: true
				}
			]
		},
		zod4(alternativeCriterionValuesSchema)
	)
});

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(alternativeCriterionValuesSchema));

		if (!form.valid) return fail(400, { form });

		// ponytail: frontend preview only; replace this with one database transaction.
		return message(form, { type: 'success', text: 'Nilai dummy berhasil disimpan' });
	}
};
