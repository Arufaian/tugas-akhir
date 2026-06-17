import { z } from 'zod';

const alternativeImageSchema = z.object({
	url: z.string(),
	path: z.string().nullable(),
	originalName: z.string().optional()
});

export const alternativeSchema = z.object({
	id: z.string().uuid(),
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

export type AlternativeImage = z.infer<typeof alternativeImageSchema>;
