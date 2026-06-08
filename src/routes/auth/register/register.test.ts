import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

// ---- Types ----

interface ActionResult {
	status?: number;
	data?: {
		form: {
			valid?: boolean;
			message?: Record<string, unknown>;
		};
	};
	form?: {
		valid?: boolean;
		message?: Record<string, unknown>;
	};
}

type ActionsParam = Parameters<typeof actions.default>[0];

// ---- Helpers ----

function createMockEvent(formData: FormData) {
	return {
		request: new Request('http://localhost/auth/register', {
			method: 'POST',
			body: formData
		}),
		url: new URL('http://localhost/auth/register'),
		locals: {
			supabase: {
				auth: {
					signUp: vi.fn()
				}
			}
		}
	};
}

function validFormData() {
	const fd = new FormData();
	fd.append('name', 'John Doe');
	fd.append('email', 'john@example.com');
	fd.append('password', 'Test1234!');
	fd.append('confirmPassword', 'Test1234!');
	return fd;
}

// ---- Tests ----

describe('register action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns validation error for empty form', async () => {
		const result = (await actions.default(
			createMockEvent(new FormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns validation error when passwords do not match', async () => {
		const fd = validFormData();
		fd.set('confirmPassword', 'Different1!');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns validation error for short name', async () => {
		const fd = validFormData();
		fd.set('name', 'A');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns validation error for invalid email', async () => {
		const fd = validFormData();
		fd.set('email', 'not-an-email');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns error when signUp fails', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signUp.mockResolvedValue({
			error: { message: 'Email already registered' }
		});

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toContain('Email already registered');
	});

	it('returns generic error message when signUp fails without message', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signUp.mockResolvedValue({
			error: { message: '' }
		});

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toContain('Gagal mendaftar');
	});

	it('returns success when signUp succeeds', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signUp.mockResolvedValue({
			error: null
		});

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
		expect(result.form?.message?.type).toBe('success');
		expect(result.form?.message?.text).toContain('cek email');
	});
});
