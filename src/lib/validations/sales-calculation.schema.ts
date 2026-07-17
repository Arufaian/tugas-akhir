import { z } from 'zod';

export const salesCalculationSchema = z
	.strictObject({
		category: z.string().trim().min(1, 'Kategori wajib dipilih'),
		priceRange: z.tuple([
			z.number().int().nonnegative('Harga minimum tidak valid'),
			z.number().int().nonnegative('Harga maksimum tidak valid')
		])
	})
	.refine(({ priceRange }) => priceRange[0] <= priceRange[1], {
		error: 'Harga minimum tidak boleh lebih besar dari harga maksimum',
		path: ['priceRange']
	});

export type SalesCalculationInput = z.infer<typeof salesCalculationSchema>;
export type SalesCalculationSchema = typeof salesCalculationSchema;
