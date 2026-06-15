import { z } from 'zod';

export const alternativeSchema = z.object({
	id: z.string().uuid(),
	code: z.string().trim().min(1, 'Kode wajib diisi'),
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	category: z.string().nullable().optional(),
	imgUrl: z.string().nullable().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date(),
	updatedAt: z.date()
});

export type Alternative = z.infer<typeof alternativeSchema>;
export type AlternativeSchema = typeof alternativeSchema;

export const createAlternativeSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi'),
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	category: z.string().nullable().optional(),
	imgUrl: z.string().url('URL gambar tidak valid').nullable().optional(),
	isActive: z.boolean().default(true)
});

export type CreateAlternativeInput = z.infer<typeof createAlternativeSchema>;
export type CreateAlternativeSchema = typeof createAlternativeSchema;
