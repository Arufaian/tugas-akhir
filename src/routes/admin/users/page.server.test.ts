import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockListUsers,
	mockCreateUser,
	mockGetUserById,
	mockUpdateUser,
	mockWhere,
	mockSet,
	mockUpdateWhere
} = vi.hoisted(() => ({
	mockListUsers: vi.fn(),
	mockCreateUser: vi.fn(),
	mockGetUserById: vi.fn(),
	mockUpdateUser: vi.fn(),
	mockWhere: vi.fn(),
	mockSet: vi.fn(),
	mockUpdateWhere: vi.fn()
}));

vi.mock('$lib/server/supabase-admin.js', () => ({
	supabaseAdmin: {
		auth: {
			admin: {
				listUsers: mockListUsers,
				createUser: mockCreateUser,
				getUserById: mockGetUserById,
				updateUserById: mockUpdateUser
			}
		}
	}
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: () => ({ from: () => ({ where: mockWhere }) }),
		update: () => ({ set: mockSet })
	}
}));

import { actions, load } from './+page.server.js';

const adminId = '11111111-1111-4111-8111-111111111111';
const salesId = '22222222-2222-4222-8222-222222222222';

function event(request?: Request) {
	return {
		request,
		locals: {
			safeGetSession: vi.fn().mockResolvedValue({ user: { id: adminId }, session: {} })
		}
	} as never;
}

function formRequest(overrides: Record<string, string> = {}) {
	const form = new FormData();
	form.set('name', 'Budi Santoso');
	form.set('email', 'budi@example.com');
	form.set('password', 'Password1!');
	form.set('confirmPassword', 'Password1!');
	for (const [key, value] of Object.entries(overrides)) form.set(key, value);

	return new Request('http://localhost/admin/users?/create', { method: 'POST', body: form });
}

function updateRequest(overrides: Record<string, string> = {}) {
	const form = new FormData();
	form.set('userId', salesId);
	form.set('name', 'Budi Baru');
	form.set('email', 'baru@example.com');
	for (const [key, value] of Object.entries(overrides)) form.set(key, value);

	return new Request('http://localhost/admin/users?/update', { method: 'POST', body: form });
}

describe('user management page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateUser.mockResolvedValue({ data: { user: {} }, error: null });
		mockGetUserById.mockResolvedValue({
			data: { user: { id: salesId, email: 'sales@example.com' } },
			error: null
		});
		mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
		mockUpdateWhere.mockResolvedValue(undefined);
		mockSet.mockReturnValue({ where: mockUpdateWhere });
	});

	it('loads users, profiles, status, and summary', async () => {
		mockListUsers.mockResolvedValue({
			data: {
				total: 2,
				users: [
					{
						id: salesId,
						email: 'sales@example.com',
						created_at: '2026-02-01T00:00:00.000Z',
						banned_until: '2099-01-01T00:00:00.000Z',
						user_metadata: { full_name: 'Sales Metadata' }
					},
					{
						id: adminId,
						email: 'admin@example.com',
						created_at: '2026-01-01T00:00:00.000Z',
						user_metadata: {}
					}
				]
			},
			error: null
		});
		mockWhere.mockResolvedValue([{ id: adminId, name: 'Admin', role: 'admin' }]);

		const result = await load(event());
		if (!result) throw new Error('Expected page data');

		expect(mockListUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
		expect(result.summary).toEqual({ total: 2, active: 1, inactive: 1 });
		expect(result.users).toEqual([
			expect.objectContaining({
				id: salesId,
				name: 'Sales Metadata',
				role: 'sales',
				isActive: false
			}),
			expect.objectContaining({ id: adminId, name: 'Admin', role: 'admin', isCurrentUser: true })
		]);
	});

	it('rejects a truncated user list', async () => {
		mockListUsers.mockResolvedValue({ data: { total: 2, users: [] }, error: null });

		await expect(load(event())).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal memuat pengguna.' }
		});
	});

	it('returns a generic load error when the profile query fails', async () => {
		mockListUsers.mockResolvedValue({
			data: {
				total: 1,
				users: [{ id: adminId, created_at: '2026-01-01T00:00:00.000Z', user_metadata: {} }]
			},
			error: null
		});
		mockWhere.mockRejectedValue(new Error('sensitive database error'));

		await expect(load(event())).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal memuat pengguna.' }
		});
	});

	it('rejects invalid forms without returning passwords', async () => {
		const result = (await actions.create(
			event(formRequest({ confirmPassword: 'Different1!' }))
		)) as {
			status: number;
			data: { form: { data: { password: string; confirmPassword: string } } };
		};

		expect(result.status).toBe(400);
		expect(result.data.form.data).toMatchObject({ password: '', confirmPassword: '' });
		expect(mockCreateUser).not.toHaveBeenCalled();
	});

	it('creates a confirmed user without returning passwords', async () => {
		const result = (await actions.create(event(formRequest()))) as {
			form: { data: { password: string; confirmPassword: string } };
		};

		expect(mockCreateUser).toHaveBeenCalledWith({
			email: 'budi@example.com',
			password: 'Password1!',
			email_confirm: true,
			user_metadata: { full_name: 'Budi Santoso' }
		});
		expect(result.form.data).toMatchObject({ password: '', confirmPassword: '' });
	});

	it('maps duplicate email errors without returning passwords', async () => {
		mockCreateUser.mockResolvedValue({ data: { user: null }, error: { code: 'email_exists' } });

		const result = (await actions.create(event(formRequest()))) as {
			status: number;
			data: {
				form: {
					data: { password: string; confirmPassword: string };
					message: { type: string; text: string };
				};
			};
		};

		expect(result.status).toBe(409);
		expect(result.data.form.message.text).toBe('Email sudah digunakan.');
		expect(result.data.form.data).toMatchObject({ password: '', confirmPassword: '' });
	});

	it('returns a generic create error', async () => {
		mockCreateUser.mockRejectedValue(new Error('sensitive network error'));

		const result = (await actions.create(event(formRequest()))) as {
			status: number;
			data: { form: { message: { text: string } } };
		};

		expect(result.status).toBe(500);
		expect(result.data.form.message.text).toBe('Gagal menambahkan pengguna. Silakan coba lagi.');
	});

	it('allows the current admin to update their name and confirmed email', async () => {
		mockWhere.mockResolvedValue([{ name: 'Sales Lama' }]);
		mockGetUserById.mockResolvedValue({
			data: { user: { id: adminId, email: 'admin@example.com' } },
			error: null
		});

		const result = (await actions.update(event(updateRequest({ userId: adminId })))) as {
			form: { message: { text: string } };
		};

		expect(mockSet).toHaveBeenCalledWith({ name: 'Budi Baru' });
		expect(mockUpdateUser).toHaveBeenCalledWith(adminId, {
			email: 'baru@example.com',
			email_confirm: true
		});
		expect(result.form.message.text).toBe('Pengguna berhasil diperbarui.');
	});

	it('skips writes when user identity is unchanged', async () => {
		mockWhere.mockResolvedValue([{ name: 'Budi Baru' }]);
		mockGetUserById.mockResolvedValue({
			data: { user: { id: salesId, email: 'baru@example.com' } },
			error: null
		});

		await actions.update(event(updateRequest()));

		expect(mockSet).not.toHaveBeenCalled();
		expect(mockUpdateUser).not.toHaveBeenCalled();
	});

	it('returns a generic update error when the profile update fails', async () => {
		mockWhere.mockResolvedValue([{ name: 'Sales Lama' }]);
		mockUpdateWhere.mockRejectedValueOnce(new Error('sensitive database error'));

		const result = (await actions.update(event(updateRequest()))) as {
			status: number;
			data: { form: { message: { text: string } } };
		};

		expect(result.status).toBe(500);
		expect(result.data.form.message.text).toBe('Gagal memperbarui pengguna. Silakan coba lagi.');
		expect(mockUpdateUser).not.toHaveBeenCalled();
	});

	it('rejects invalid identity updates', async () => {
		const result = (await actions.update(event(updateRequest({ userId: 'invalid' })))) as {
			status: number;
		};

		expect(result.status).toBe(400);
		expect(mockGetUserById).not.toHaveBeenCalled();
		expect(mockSet).not.toHaveBeenCalled();
	});

	it('restores the old name when the email is already used', async () => {
		mockWhere.mockResolvedValue([{ name: 'Sales Lama' }]);
		mockUpdateUser.mockResolvedValue({
			data: { user: null },
			error: { code: 'email_exists' }
		});

		const result = (await actions.update(event(updateRequest()))) as {
			status: number;
			data: { form: { message: { text: string } } };
		};

		expect(mockSet).toHaveBeenNthCalledWith(1, { name: 'Budi Baru' });
		expect(mockSet).toHaveBeenNthCalledWith(2, { name: 'Sales Lama' });
		expect(result.status).toBe(409);
		expect(result.data.form.message.text).toBe('Email sudah digunakan.');
	});

	it('rejects identity updates for missing users or profiles', async () => {
		mockWhere.mockResolvedValue([]);

		const result = (await actions.update(event(updateRequest()))) as {
			status: number;
			data: { form: { message: { text: string } } };
		};

		expect(result.status).toBe(404);
		expect(result.data.form.message.text).toBe('Pengguna tidak ditemukan.');
		expect(mockSet).not.toHaveBeenCalled();
		expect(mockUpdateUser).not.toHaveBeenCalled();
	});

	it('restores the old name when the auth update throws', async () => {
		mockWhere.mockResolvedValue([{ name: 'Sales Lama' }]);
		mockUpdateUser.mockRejectedValue(new Error('sensitive network error'));

		const result = (await actions.update(event(updateRequest()))) as {
			status: number;
			data: { form: { message: { text: string } } };
		};

		expect(mockSet).toHaveBeenNthCalledWith(1, { name: 'Budi Baru' });
		expect(mockSet).toHaveBeenNthCalledWith(2, { name: 'Sales Lama' });
		expect(result.status).toBe(500);
		expect(result.data.form.message.text).toBe('Gagal memperbarui pengguna. Silakan coba lagi.');
	});
});
