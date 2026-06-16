import { describe, it, expect } from 'vitest';
import { createAlternativeSchema } from './alternative.schema';

const validData = {
	name: 'New Motor',
	category: 'Matic',
	imgUrl: 'https://storage.supabase.co/example.jpg'
};

describe('createAlternativeSchema', () => {
	describe('name validation', () => {
		it('accepts valid name', () => {
			const result = createAlternativeSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('New Motor');
			}
		});

		it('trims whitespace from name', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				name: '  Test Motor  '
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('Test Motor');
			}
		});

		it('rejects empty name', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				name: ''
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('wajib diisi');
			}
		});

		it('rejects whitespace-only name', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				name: '   '
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('wajib diisi');
			}
		});
	});

	describe('category validation', () => {
		it('accepts category', () => {
			const result = createAlternativeSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.category).toBe('Matic');
			}
		});

		it('rejects null category', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				category: null
			});

			expect(result.success).toBe(false);
		});

		it('accepts undefined category', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { category, ...dataWithoutCategory } = validData;
			const result = createAlternativeSchema.safeParse(dataWithoutCategory);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.category).toBeUndefined();
			}
		});
	});

	describe('imgUrl validation', () => {
		it('accepts valid URL', () => {
			const result = createAlternativeSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.imgUrl).toBe('https://storage.supabase.co/example.jpg');
			}
		});

		it('rejects invalid URL string', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				imgUrl: 'not-a-url'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('URL gambar tidak valid');
			}
		});

		it('accepts null imgUrl', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				imgUrl: null
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.imgUrl).toBeNull();
			}
		});

		it('accepts undefined imgUrl', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { imgUrl, ...dataWithoutImgUrl } = validData;
			const result = createAlternativeSchema.safeParse(dataWithoutImgUrl);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.imgUrl).toBeUndefined();
			}
		});
	});

	describe('edge cases', () => {
		it('rejects empty object', () => {
			const result = createAlternativeSchema.safeParse({});

			expect(result.success).toBe(false);
		});

		it('strips extra unknown fields', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				extraField: 'should be stripped'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty('extraField');
			}
		});

		it('does not accept id field', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				id: '123e4567-e89b-12d3-a456-426614174000'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty('id');
			}
		});
	});
});
