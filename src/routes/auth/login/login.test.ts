import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

// ---- Drizzle DB mock ----

const { mockSelect, mockLimit } = vi.hoisted(() => {
	const mockLimit = vi.fn();
	const mockWhere = vi.fn(() => ({ limit: mockLimit }));
	const mockFrom = vi.fn(() => ({ where: mockWhere }));
	const mockSelect = vi.fn(() => ({ from: mockFrom }));
	return { mockSelect, mockLimit };
});

vi.mock('$lib/server/db', () => ({
	db: { select: mockSelect }
}));

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
		request: new Request('http://localhost/auth/login', {
			method: 'POST',
			body: formData
		}),
		locals: {
			supabase: {
				auth: {
					signInWithPassword: vi.fn(),
					getUser: vi.fn()
				}
			}
		}
	};
}

function validFormData() {
	const fd = new FormData();
	fd.append('email', 'test@example.com');
	fd.append('password', 'Test1234!');
	return fd;
}

// ---- Tests ----

describe('login action', () => {
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

	it('returns validation error for weak password', async () => {
		const fd = new FormData();
		fd.append('email', 'test@example.com');
		fd.append('password', 'Ab1!');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns error when auth fails', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signInWithPassword.mockResolvedValue({
			error: { message: 'Invalid login credentials' }
		});

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toContain('Invalid login credentials');
	});

	it('returns success with sales role', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
		event.locals.supabase.auth.getUser.mockResolvedValue({
			data: { user: { id: 'x', email: 'test@example.com' } }
		});
		mockLimit.mockResolvedValue([{ role: 'sales' }]);

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
		expect(result.form?.message?.type).toBe('success');
		expect(result.form?.message?.text).toContain('berhasil');
		expect(result.form?.message?.role).toBe('sales');
	});

	it('returns success with admin role', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
		event.locals.supabase.auth.getUser.mockResolvedValue({
			data: { user: { id: 'x', email: 'admin@example.com' } }
		});
		mockLimit.mockResolvedValue([{ role: 'admin' }]);

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
		expect(result.form?.message?.type).toBe('success');
		expect(result.form?.message?.role).toBe('admin');
	});

	it('returns success with undefined role when no profile', async () => {
		const event = createMockEvent(validFormData());
		event.locals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
		event.locals.supabase.auth.getUser.mockResolvedValue({
			data: { user: { id: 'x', email: 'test@example.com' } }
		});
		mockLimit.mockResolvedValue([]);

		const result = (await actions.default(
			event as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
		expect(result.form?.message?.type).toBe('success');
		expect(result.form?.message?.role).toBeUndefined();
	});
});
