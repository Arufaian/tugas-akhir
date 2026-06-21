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

export type Criterion = z.infer<typeof criterionSchema>;
