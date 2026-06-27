import { z } from 'zod';

export const createCriterionScaleSchema = z.object({
	label: z.string().trim().min(1, 'Label wajib diisi'),
	value: z.coerce.number().int().min(1, 'Nilai minimal 1').max(5, 'Nilai maksimal 5').default(1),
	description: z.string().optional()
});
