import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUpdateUser } = vi.hoisted(() => ({ mockUpdateUser: vi.fn() }));

vi.mock('$lib/server/supabase-admin.js', () => ({
	supabaseAdmin: { auth: { admin: { updateUserById: mockUpdateUser } } }
}));

import { PATCH } from './+server.js';

const currentUserId = '11111111-1111-4111-8111-111111111111';
const targetUserId = '22222222-2222-4222-8222-222222222222';

function request(isActive: unknown, id = targetUserId) {
	return {
		params: { id },
		request: new Request(`http://localhost/admin/users/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ isActive })
		}),
		locals: {
			safeGetSession: vi.fn().mockResolvedValue({ user: { id: currentUserId }, session: {} })
		}
	} as never;
}

describe('user status endpoint', () => {
	beforeEach(() => vi.clearAllMocks());

	it('rejects invalid input and self-deactivation', async () => {
		await expect(PATCH(request(true, 'invalid'))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request('false'))).rejects.toMatchObject({ status: 400 });
		await expect(PATCH(request(false, currentUserId))).rejects.toMatchObject({ status: 403 });
		expect(mockUpdateUser).not.toHaveBeenCalled();
	});

	it.each([
		[false, '876000h', '2099-01-01T00:00:00.000Z'],
		[true, 'none', undefined]
	] as const)(
		'sets active=%s using Supabase ban duration',
		async (isActive, duration, bannedUntil) => {
			mockUpdateUser.mockResolvedValue({
				data: { user: { banned_until: bannedUntil } },
				error: null
			});

			const response = await PATCH(request(isActive));

			expect(mockUpdateUser).toHaveBeenCalledWith(targetUserId, { ban_duration: duration });
			expect(await response.json()).toEqual({ success: true, isActive });
		}
	);

	it('returns 404 for an unknown user', async () => {
		mockUpdateUser.mockResolvedValue({
			data: { user: null },
			error: { code: 'user_not_found' }
		});

		await expect(PATCH(request(true))).rejects.toMatchObject({ status: 404 });
	});

	it('returns a generic error when Supabase fails', async () => {
		mockUpdateUser.mockRejectedValue(new Error('sensitive network error'));

		await expect(PATCH(request(true))).rejects.toMatchObject({
			status: 500,
			body: { message: 'Gagal mengubah status pengguna.' }
		});
	});
});
