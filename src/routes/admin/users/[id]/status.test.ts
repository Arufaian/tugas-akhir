import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDeleteUser, mockLimit, mockUpdateUser, mockUpdateSet, mockUpdateWhere } =
	vi.hoisted(() => ({
		mockDeleteUser: vi.fn(),
		mockLimit: vi.fn(),
		mockUpdateUser: vi.fn(),
		mockUpdateSet: vi.fn(),
		mockUpdateWhere: vi.fn()
	}));

vi.mock('$lib/server/supabase-admin.js', () => ({
	supabaseAdmin: {
		auth: { admin: { deleteUser: mockDeleteUser, updateUserById: mockUpdateUser } }
	}
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: () => ({ from: () => ({ where: () => ({ limit: mockLimit }) }) }),
		update: () => ({ set: mockUpdateSet })
	}
}));

import { DELETE, PATCH } from './+server.js';

const currentUserId = '11111111-1111-4111-8111-111111111111';
const targetUserId = '22222222-2222-4222-8222-222222222222';

function request(payload: Record<string, unknown>, id = targetUserId) {
	return {
		params: { id },
		request: new Request(`http://localhost/admin/users/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		}),
		locals: {
			safeGetSession: vi.fn().mockResolvedValue({ user: { id: currentUserId }, session: {} })
		}
	} as never;
}

function deleteRequest(id = targetUserId) {
	return { params: { id } } as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mockDeleteUser.mockResolvedValue({ data: { user: {} }, error: null });
	mockLimit.mockResolvedValue([{ role: 'sales' }]);
	mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
	mockUpdateWhere.mockResolvedValue(undefined);
});

describe('user status and role endpoint', () => {
	it('rejects invalid input and self-deactivation', async () => {
		await expect(PATCH(request({ isActive: true }, 'invalid'))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request({ isActive: 'false' }))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request({ role: 'superadmin' }))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request({}))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request({ isActive: false }, currentUserId))).rejects.toMatchObject({
			status: 403
		});
		expect(mockUpdateUser).not.toHaveBeenCalled();
	});

	it('promotes user role to admin in database', async () => {
		const response = await PATCH(request({ role: 'admin' }));

		expect(mockUpdateSet).toHaveBeenCalledWith({ role: 'admin' });
		expect(await response.json()).toEqual({ success: true });
	});

	it('returns a generic error when database role update fails', async () => {
		mockUpdateWhere.mockRejectedValueOnce(new Error('db error'));

		await expect(PATCH(request({ role: 'admin' }))).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal memperbarui role pengguna.' }
		});
	});

	it.each([
		[false, '876000h'],
		[true, 'none']
	] as const)('sets active=%s using Supabase ban duration', async (isActive, duration) => {
		mockUpdateUser.mockResolvedValue({
			data: { user: {} },
			error: null
		});

		const response = await PATCH(request({ isActive }));

		expect(mockUpdateUser).toHaveBeenCalledWith(targetUserId, { ban_duration: duration });
		expect(await response.json()).toEqual({ success: true });
	});

	it('returns 404 for an unknown user when changing active status', async () => {
		mockUpdateUser.mockResolvedValue({
			data: { user: null },
			error: { code: 'user_not_found' }
		});

		await expect(PATCH(request({ isActive: true }))).rejects.toMatchObject({ status: 404 });
	});

	it('returns a generic error when Supabase fails', async () => {
		mockUpdateUser.mockRejectedValue(new Error('sensitive network error'));

		await expect(PATCH(request({ isActive: true }))).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal mengubah status pengguna.' }
		});
	});
});

describe('user delete endpoint', () => {
	it('rejects invalid IDs and admin accounts', async () => {
		await expect(DELETE(deleteRequest('invalid'))).rejects.toMatchObject({ status: 400 });

		mockLimit.mockResolvedValue([{ role: 'admin' }]);
		await expect(DELETE(deleteRequest())).rejects.toMatchObject({
			status: 403,
			body: { message: 'Akun admin tidak dapat dihapus.' }
		});
		expect(mockDeleteUser).not.toHaveBeenCalled();
	});

	it.each([[{ role: 'sales' }], [null]])('deletes sales and orphan auth users', async (profile) => {
		mockLimit.mockResolvedValue(profile ? [profile] : []);

		const response = await DELETE(deleteRequest());

		expect(mockDeleteUser).toHaveBeenCalledWith(targetUserId);
		expect(await response.json()).toEqual({ success: true });
	});

	it('returns 404 for an unknown user', async () => {
		mockDeleteUser.mockResolvedValue({
			data: { user: null },
			error: { code: 'user_not_found' }
		});

		await expect(DELETE(deleteRequest())).rejects.toMatchObject({ status: 404 });
	});

	it('returns a generic error when deletion fails', async () => {
		mockDeleteUser.mockRejectedValue(new Error('sensitive network error'));

		await expect(DELETE(deleteRequest())).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal menghapus pengguna.' }
		});
	});
});
