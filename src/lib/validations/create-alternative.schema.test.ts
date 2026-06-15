import { describe, it, expect } from 'vitest';
import { createAlternativeSchema } from './alternative.schema';

const validData = {
	code: 'A31',
	name: 'New Motor',
	category: 'Matic',
	imgUrl: 'https://storage.supabase.co/example.jpg',
	isActive: true
};

describe('createAlternativeSchema', () => {
	describe('code validation', () => {
		it('accepts valid code', () => {
			const result = createAlternativeSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.code).toBe('A31');
			}
		});

		it('trims whitespace from code', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				code: '  B1  '
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.code).toBe('B1');
			}
		});

		it('rejects empty code', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				code: ''
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('wajib diisi');
			}
		});

		it('rejects whitespace-only code', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				code: '   '
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('wajib diisi');
			}
		});
	});

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

		it('accepts null category', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				category: null
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.category).toBeNull();
			}
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

	describe('isActive validation', () => {
		it('defaults to true', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { isActive, ...dataWithoutIsActive } = validData;
			const result = createAlternativeSchema.safeParse(dataWithoutIsActive);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isActive).toBe(true);
			}
		});

		it('accepts false', () => {
			const result = createAlternativeSchema.safeParse({
				...validData,
				isActive: false
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isActive).toBe(false);
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
