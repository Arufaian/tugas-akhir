import { z } from 'zod';

export const criterionSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	unit: z.string().nullable(),
	rawWeight: z.string(),
	normalizedWeight: z.string(),
	type: z.enum(['benefit', 'cost']),
	inputType: z.enum(['number', 'scale', 'tech_features']),
	orderIndex: z.number(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const createCriterionSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	description: z.string().optional(),
	unit: z.string().min(1, 'Satuan wajib diisi'),
	rawWeight: z
		.string()
		.default('3')
		.refine((val) => ['1', '2', '3', '4', '5'].includes(val), 'Bobot harus antara 1-5'),
	type: z.enum(['benefit', 'cost']).default('benefit'),
	inputType: z.enum(['number', 'scale', 'tech_features']).default('number')
});

export type Criterion = z.infer<typeof criterionSchema>;

export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;
export type CreateCriterionSchema = typeof createCriterionSchema;
