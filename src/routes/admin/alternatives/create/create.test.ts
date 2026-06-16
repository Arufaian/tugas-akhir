import type { PageServerLoad } from './$types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions, load } from './+page.server';

const { mockSelect, mockLimit, mockInsert } = vi.hoisted(() => {
	const mockLimit = vi.fn();
	const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
	const mockFrom = vi.fn(() => ({ orderBy: mockOrderBy }));
	const mockSelect = vi.fn(() => ({ from: mockFrom }));

	const mockInsertValues = vi.fn();
	const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

	return { mockSelect, mockLimit, mockInsert, mockInsertValues };
});

vi.mock('$lib/server/db', () => ({
	db: { select: mockSelect, insert: mockInsert }
}));

interface ActionResult {
	status?: number;
	data?: {
		form: {
			valid?: boolean;
			message?: { type: string; text: string };
		};
	};
	form?: {
		valid?: boolean;
		message?: { type: string; text: string };
	};
}

type ActionsParam = Parameters<typeof actions.default>[0];

function createMockEvent(formData: FormData) {
	return {
		request: new Request('http://localhost/admin/alternatives/create', {
			method: 'POST',
			body: formData
		}),
		url: new URL('http://localhost/admin/alternatives/create'),
		locals: { supabase: null }
	};
}

function validFormData() {
	const fd = new FormData();
	fd.append('name', 'Motor Test');
	fd.append('category', 'Classy');
	fd.append('imgUrl', 'https://example.com/motor.jpg');
	return fd;
}

function nameOnlyFormData() {
	const fd = new FormData();
	fd.append('name', 'Motor Minimal');
	return fd;
}

describe('create alternative action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ---- Validation ----

	it('returns validation error for empty form', async () => {
		const result = (await actions.default(
			createMockEvent(new FormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns validation error when name is missing', async () => {
		const fd = new FormData();
		fd.append('category', 'Classy');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('returns validation error for invalid imgUrl', async () => {
		const fd = new FormData();
		fd.append('name', 'Motor Test');
		fd.append('imgUrl', 'not-a-url');

		const result = (await actions.default(
			createMockEvent(fd) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.status).toBe(400);
		expect(result.data?.form.valid).toBe(false);
	});

	it('passes validation with only name (optional fields omitted)', async () => {
		mockLimit.mockResolvedValue([]);
		mockInsert.mockImplementation(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
	});

	// ---- Code generation ----

	it('generates code A1 when no alternatives exist', async () => {
		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.valid).toBe(true);
		expect(result.form?.message?.type).toBe('success');
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ code: 'A1', name: 'Motor Minimal' })
		);
	});

	it('generates incremented code when alternatives exist', async () => {
		mockLimit.mockResolvedValue([{ code: 'A5' }]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.message?.type).toBe('success');
		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ code: 'A6' }));
	});

	it('generates A10 after A9 (numeric sort, not lexicographic)', async () => {
		mockLimit.mockResolvedValue([{ code: 'A9' }]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.form?.message?.type).toBe('success');
		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ code: 'A10' }));
	});

	it('generates code ANaN when existing code does not start with A (known bug)', async () => {
		mockLimit.mockResolvedValue([{ code: 'B2' }]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		await actions.default(createMockEvent(nameOnlyFormData()) as unknown as ActionsParam);

		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ code: 'ANaN' }));
	});

	// ---- Data mapping ----

	it('maps only name and auto-generated code on insert', async () => {
		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		await actions.default(createMockEvent(nameOnlyFormData()) as unknown as ActionsParam);

		expect(mockInsertValues).toHaveBeenCalledWith({
			code: 'A1',
			name: 'Motor Minimal',
			category: null,
			imgUrl: null
		});
	});

	it('maps all fields including category and imgUrl', async () => {
		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		await actions.default(createMockEvent(validFormData()) as unknown as ActionsParam);

		expect(mockInsertValues).toHaveBeenCalledWith({
			code: 'A1',
			name: 'Motor Test',
			category: 'Classy',
			imgUrl: 'https://example.com/motor.jpg'
		});
	});

	it('maps empty string imgUrl to null', async () => {
		const fd = new FormData();
		fd.append('name', 'Motor Test');
		fd.append('imgUrl', '');

		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		await actions.default(createMockEvent(fd) as unknown as ActionsParam);

		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: null }));
	});

	it('maps empty string category to null', async () => {
		const fd = new FormData();
		fd.append('name', 'Motor Test');
		fd.append('category', '');

		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockResolvedValue(undefined);
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		await actions.default(createMockEvent(fd) as unknown as ActionsParam);

		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
	});

	// ---- Error handling ----

	it('returns error message when select query fails', async () => {
		mockLimit.mockRejectedValue(new Error('DB connection failed'));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toContain('DB connection failed');
	});

	it('returns error message when insert query fails', async () => {
		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockRejectedValue(new Error('Unique constraint violation'));
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toContain('Unique constraint violation');
	});

	it('returns generic message when insert throws non-Error', async () => {
		mockLimit.mockResolvedValue([]);
		const mockInsertValues = vi.fn().mockRejectedValue('string error');
		mockInsert.mockImplementation(() => ({ values: mockInsertValues }));

		const result = (await actions.default(
			createMockEvent(nameOnlyFormData()) as unknown as ActionsParam
		)) as unknown as ActionResult;

		expect(result.data?.form.message?.type).toBe('error');
		expect(result.data?.form.message?.text).toBe('Gagal menyimpan data');
	});
});

// ---- Load function ----

describe('create alternative load', () => {
	it('returns an object with form property', async () => {
		const result = await load({} as Parameters<PageServerLoad>[0]);

		expect(result).toHaveProperty('form');
	});
});
