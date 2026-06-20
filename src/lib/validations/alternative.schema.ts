import { z } from 'zod';

export const alternativeImageSchema = z.object({
	url: z.string(),
	path: z.string().nullable(),
	originalName: z.string().optional()
});

export const alternativeSchema = z.object({
	id: z.uuid(),
	code: z.string().trim().min(1, 'Kode wajib diisi'),
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	category: z.string().nullable().optional(),
	img: alternativeImageSchema.nullable().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date(),
	updatedAt: z.date()
});

export type Alternative = z.infer<typeof alternativeSchema>;
export type AlternativeSchema = typeof alternativeSchema;

export const createAlternativeSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	category: z.string().optional(),
	img: z.string().nullable().optional()
});

export type CreateAlternativeInput = z.infer<typeof createAlternativeSchema>;
export type CreateAlternativeSchema = typeof createAlternativeSchema;

export const updateAlternativeSchema = createAlternativeSchema.extend({
	isActive: z.boolean().optional()
});

export type UpdateAlternativeInput = z.infer<typeof updateAlternativeSchema>;
export type UpdateAlternativeSchema = typeof updateAlternativeSchema;

export type AlternativeImage = z.infer<typeof alternativeImageSchema>;
