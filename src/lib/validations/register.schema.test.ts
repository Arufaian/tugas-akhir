import { describe, it, expect } from 'vitest';
import { registerSchema } from './register.schema';

const validData = {
	name: 'John Doe',
	email: 'john@example.com',
	password: 'Test1234!',
	confirmPassword: 'Test1234!'
};

describe('registerSchema', () => {
	describe('name validation', () => {
		it('accepts valid name', () => {
			const result = registerSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('John Doe');
			}
		});

		it('trims whitespace from name', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: '  John  '
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('John');
			}
		});

		it('accepts name at minimum 3 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: 'ABC'
			});

			expect(result.success).toBe(true);
		});

		it('accepts name at maximum 50 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: 'A'.repeat(50)
			});

			expect(result.success).toBe(true);
		});

		it('rejects name shorter than 3 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: 'AB'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('Nama minimal 3 karakter');
			}
		});

		it('rejects single character name', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: 'A'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('Nama minimal 3 karakter');
			}
		});

		it('rejects name longer than 50 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: 'A'.repeat(51)
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('Nama maksimal 50 karakter');
			}
		});

		it('rejects empty name', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: ''
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('Nama tidak boleh kosong');
			}
		});

		it('rejects whitespace-only name', () => {
			const result = registerSchema.safeParse({
				...validData,
				name: '   '
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('Nama tidak boleh kosong');
			}
		});
	});

	describe('email validation', () => {
		it('accepts valid email', () => {
			const result = registerSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe('john@example.com');
			}
		});

		it('trims whitespace and lowercases email', () => {
			const result = registerSchema.safeParse({
				...validData,
				email: '  John@Example.Com  '
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe('john@example.com');
			}
		});

		it('rejects invalid email format', () => {
			const result = registerSchema.safeParse({
				...validData,
				email: 'not-an-email'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Format email tidak valid');
			}
		});

		it('rejects empty email', () => {
			const result = registerSchema.safeParse({
				...validData,
				email: ''
			});

			expect(result.success).toBe(false);
		});

		it('rejects whitespace-only email', () => {
			const result = registerSchema.safeParse({
				...validData,
				email: '   '
			});

			expect(result.success).toBe(false);
		});
	});

	describe('password validation', () => {
		it('accepts password meeting all criteria', () => {
			const result = registerSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});

		it('accepts password at minimum 8 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'Abcd123!',
				confirmPassword: 'Abcd123!'
			});

			expect(result.success).toBe(true);
		});

		it('rejects password shorter than 8 characters', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'Ab1!',
				confirmPassword: 'Ab1!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('minimal 8 karakter');
			}
		});

		it('rejects password without uppercase letter', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'test1234!',
				confirmPassword: 'test1234!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('huruf besar'))).toBe(true);
			}
		});

		it('rejects password without lowercase letter', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'TEST1234!',
				confirmPassword: 'TEST1234!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('huruf kecil'))).toBe(true);
			}
		});

		it('rejects password without digit', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'Testabcd!',
				confirmPassword: 'Testabcd!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('angka'))).toBe(true);
			}
		});

		it('rejects password without special character', () => {
			const result = registerSchema.safeParse({
				...validData,
				password: 'Test1234',
				confirmPassword: 'Test1234'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('simbol'))).toBe(true);
			}
		});
	});

	describe('confirmPassword validation', () => {
		it('accepts matching confirmPassword', () => {
			const result = registerSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});

		it('rejects empty confirmPassword', () => {
			const result = registerSchema.safeParse({
				...validData,
				confirmPassword: ''
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('wajib diisi'))).toBe(true);
			}
		});
	});

	describe('cross-field validation', () => {
		it('rejects when password and confirmPassword do not match', () => {
			const result = registerSchema.safeParse({
				...validData,
				confirmPassword: 'Different1!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				const refineIssue = result.error.issues.find(
					(i) => i.path.includes('confirmPassword') && i.message === 'Password tidak sama'
				);
				expect(refineIssue).toBeDefined();
			}
		});
	});

	describe('edge cases', () => {
		it('rejects empty object', () => {
			const result = registerSchema.safeParse({});

			expect(result.success).toBe(false);
		});

		it('strips extra unknown fields', () => {
			const result = registerSchema.safeParse({
				...validData,
				extraField: 'should be stripped'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty('extraField');
			}
		});
	});
});
