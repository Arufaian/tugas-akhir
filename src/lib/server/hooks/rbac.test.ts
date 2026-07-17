import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleRbac } from './rbac.js';

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock('../db', () => ({ db: { select: mockSelect } }));

function profileQuery(role?: 'admin' | 'sales') {
	mockSelect.mockReturnValue({
		from: () => ({
			where: () => ({ limit: async () => (role ? [{ role }] : []) })
		})
	});
}

function request(path: string, userId: string | null) {
	const resolve = vi.fn(async () => new Response('ok'));
	const event = {
		url: new URL(`http://localhost${path}`),
		locals: {
			safeGetSession: vi.fn(async () => ({
				session: userId ? {} : null,
				user: userId ? { id: userId } : null
			}))
		}
	} as unknown as Parameters<typeof handleRbac>[0]['event'];

	return { event, resolve };
}

describe('sales calculation RBAC', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('redirects anonymous users to login', async () => {
		const { event, resolve } = request('/sales/calculate', null);

		await expect(handleRbac({ event, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/auth/login'
		});
		expect(mockSelect).not.toHaveBeenCalled();
		expect(resolve).not.toHaveBeenCalled();
	});

	it('redirects non-sales users to the public page', async () => {
		profileQuery('admin');
		const { event, resolve } = request('/sales/calculate', 'admin-1');

		await expect(handleRbac({ event, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
		expect(resolve).not.toHaveBeenCalled();
	});

	it('allows sales users to load the page and submit its action', async () => {
		profileQuery('sales');
		const { event, resolve } = request('/sales/calculate?/calculate', 'sales-1');

		const response = await handleRbac({ event, resolve });

		expect(response.status).toBe(200);
		expect(event.locals.role).toBe('sales');
		expect(resolve).toHaveBeenCalledWith(event);
	});
});
