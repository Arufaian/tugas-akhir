import { describe, it, expect } from 'vitest';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
	describe('email validation', () => {
		it('accepts standard email', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Test1234!'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe('test@example.com');
			}
		});

		it('accepts email with subdomain', () => {
			const result = loginSchema.safeParse({
				email: 'user@mail.co.id',
				password: 'Test1234!'
			});

			expect(result.success).toBe(true);
		});

		it('accepts email with plus addressing', () => {
			const result = loginSchema.safeParse({
				email: 'user+tag@example.com',
				password: 'Test1234!'
			});

			expect(result.success).toBe(true);
		});

		it('trims whitespace and lowercases email', () => {
			const result = loginSchema.safeParse({
				email: '  Test@Example.Com  ',
				password: 'Test1234!'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe('test@example.com');
			}
		});

		it('rejects invalid email format', () => {
			const result = loginSchema.safeParse({
				email: 'not-an-email',
				password: 'Test1234!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Format email tidak valid');
			}
		});

		it('rejects empty string', () => {
			const result = loginSchema.safeParse({
				email: '',
				password: 'Test1234!'
			});

			expect(result.success).toBe(false);
		});

		it('rejects whitespace-only string', () => {
			const result = loginSchema.safeParse({
				email: '   ',
				password: 'Test1234!'
			});

			expect(result.success).toBe(false);
		});
	});

	describe('password validation', () => {
		it('accepts password meeting all criteria', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Test1234!'
			});

			expect(result.success).toBe(true);
		});

		it('accepts password at minimum 8 characters', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Abcd123!'
			});

			expect(result.success).toBe(true);
		});

		it('rejects password shorter than 8 characters', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Ab1!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('minimal 8 karakter');
			}
		});

		it('rejects password without uppercase letter', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'test1234!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('huruf besar'))).toBe(true);
			}
		});

		it('rejects password without lowercase letter', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'TEST1234!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('huruf kecil'))).toBe(true);
			}
		});

		it('rejects password without digit', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Testabcd!'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('angka'))).toBe(true);
			}
		});

		it('rejects password without special character', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Test1234'
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.message.includes('simbol'))).toBe(true);
			}
		});
	});

	describe('edge cases', () => {
		it('rejects empty object', () => {
			const result = loginSchema.safeParse({});

			expect(result.success).toBe(false);
		});

		it('strips extra unknown fields', () => {
			const result = loginSchema.safeParse({
				email: 'test@example.com',
				password: 'Test1234!',
				extraField: 'should be stripped'
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty('extraField');
			}
		});
	});
});
