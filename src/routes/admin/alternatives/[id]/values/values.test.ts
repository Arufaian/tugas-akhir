import { stringify } from 'devalue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server.js';

const {
	mockSelect,
	mockTransaction,
	txSelect,
	mockDelete,
	mockDeleteWhere,
	mockInsert,
	mockInsertValues,
	mockUpsert,
	mockScaleLock
} = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockTransaction: vi.fn(),
	txSelect: vi.fn(),
	mockDelete: vi.fn(),
	mockDeleteWhere: vi.fn(),
	mockInsert: vi.fn(),
	mockInsertValues: vi.fn(),
	mockUpsert: vi.fn(),
	mockScaleLock: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: { select: mockSelect, transaction: mockTransaction }
}));

const alternativeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const numberId = '11111111-1111-4111-8111-111111111111';
const scaleId = '22222222-2222-4222-8222-222222222222';
const featuresId = '33333333-3333-4333-8333-333333333333';
const activeCriteria = [
	{ id: numberId, inputType: 'number' as const },
	{ id: scaleId, inputType: 'scale' as const },
	{ id: featuresId, inputType: 'tech_features' as const }
];

interface ActionResult {
	status?: number;
	form: { message: { type: string } };
}

function alternativeQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

function criteriaQuery(rows: unknown[]) {
	return { from: () => ({ where: () => ({ orderBy: async () => rows }) }) };
}

function rowsQuery(rows: unknown[], ordered = false) {
	return {
		from: () => ({
			where: () =>
				ordered
					? { orderBy: async () => rows }
					: { then: (resolve: (value: unknown[]) => void) => resolve(rows) }
		})
	};
}

function lockedRowsQuery(rows: unknown[]) {
	mockScaleLock.mockResolvedValue(rows);
	return { from: () => ({ where: () => ({ for: mockScaleLock }) }) };
}

function formValues(
	overrides: Partial<{
		number: string;
		scale: string;
		features: string[];
		isAssessed: boolean;
	}> = {}
) {
	return [
		{
			criterionId: numberId,
			value: overrides.number ?? '32500000',
			selectedFeatureIds: [],
			isAssessed: false
		},
		{
			criterionId: scaleId,
			value: overrides.scale ?? '3',
			selectedFeatureIds: [],
			isAssessed: false
		},
		{
			criterionId: featuresId,
			value: '',
			selectedFeatureIds: overrides.features ?? ['abs', 'smart-key'],
			isAssessed: overrides.isAssessed ?? true
		}
	];
}

function post(values = formValues()) {
	const body = new FormData();
	body.set('__superform_json', stringify({ values }));

	return {
		params: { id: alternativeId },
		request: new Request(`http://localhost/admin/alternatives/${alternativeId}/values`, {
			method: 'POST',
			body
		})
	} as unknown as Parameters<typeof actions.default>[0];
}

function useTransaction(
	criteria = activeCriteria,
	scales = [{ criterionId: scaleId, value: '3.0000', label: 'Cukup' }]
) {
	txSelect
		.mockReturnValueOnce(alternativeQuery([{ id: alternativeId }]))
		.mockReturnValueOnce(criteriaQuery(criteria))
		.mockReturnValueOnce(lockedRowsQuery(scales));
	mockTransaction.mockImplementation(async (callback) =>
		callback({ select: txSelect, delete: mockDelete, insert: mockInsert })
	);
}

describe('alternative values backend', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDelete.mockReturnValue({ where: mockDeleteWhere });
		mockInsertValues.mockReturnValue({ onConflictDoUpdate: mockUpsert });
		mockInsert.mockReturnValue({ values: mockInsertValues });
	});

	it('loads filtered values into form state', async () => {
		mockSelect
			.mockReturnValueOnce(
				alternativeQuery([{ id: alternativeId, code: 'A1', name: 'Motor Test' }])
			)
			.mockReturnValueOnce(
				criteriaQuery([
					{
						...activeCriteria[0],
						code: 'C1',
						name: 'Harga',
						description: null,
						unit: 'Rp'
					},
					{
						...activeCriteria[1],
						code: 'C2',
						name: 'Skala',
						description: null,
						unit: 'skala'
					},
					{
						...activeCriteria[2],
						code: 'C3',
						name: 'Fitur',
						description: null,
						unit: 'poin'
					}
				])
			)
			.mockReturnValueOnce(
				rowsQuery([{ criterionId: scaleId, value: '3.0000', label: 'Cukup' }], true)
			)
			.mockReturnValueOnce(
				rowsQuery([
					{ criterionId: numberId, rawValue: '32500000.0000', labelValue: null },
					{ criterionId: featuresId, rawValue: '20.0000', labelValue: '["abs","smart-key"]' }
				])
			);

		const result = (await load({ params: { id: alternativeId } } as Parameters<
			typeof load
		>[0])) as Exclude<Awaited<ReturnType<typeof load>>, void>;

		expect(result.form.data.values).toEqual([
			expect.objectContaining({ criterionId: numberId, value: '32500000' }),
			expect.objectContaining({ criterionId: scaleId, value: '' }),
			expect.objectContaining({
				criterionId: featuresId,
				selectedFeatureIds: ['abs', 'smart-key'],
				isAssessed: true
			})
		]);
	});

	it('upserts trusted number, scale, and calculated feature values', async () => {
		useTransaction();

		const result = (await actions.default(post())) as ActionResult;

		expect(result.form.message.type).toBe('success');
		expect(mockInsertValues).toHaveBeenCalledWith([
			expect.objectContaining({ criterionId: numberId, rawValue: '32500000', labelValue: null }),
			expect.objectContaining({ criterionId: scaleId, rawValue: '3.0000', labelValue: 'Cukup' }),
			expect.objectContaining({
				criterionId: featuresId,
				rawValue: '20',
				labelValue: '["abs","smart-key"]'
			})
		]);
		expect(mockUpsert).toHaveBeenCalledOnce();
		expect(mockScaleLock).toHaveBeenCalledWith('key share');
	});

	it('deletes empty and unassessed values without inserting nulls', async () => {
		useTransaction();

		const result = (await actions.default(
			post(formValues({ number: '', scale: '', features: ['abs'], isAssessed: false }))
		)) as ActionResult;

		expect(result.form.message.type).toBe('success');
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('rejects numbers outside numeric(14,4) limits before writing', async () => {
		useTransaction();

		const result = (await actions.default(
			post(formValues({ number: '12345678901.12345' }))
		)) as ActionResult;

		expect(result.status).toBe(400);
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('rejects scale values not owned by the criterion', async () => {
		useTransaction();

		const result = (await actions.default(post(formValues({ scale: '5' })))) as ActionResult;

		expect(result.status).toBe(400);
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('rejects unknown or duplicate technology features', async () => {
		useTransaction();

		const result = (await actions.default(
			post(formValues({ features: ['abs', 'abs'] }))
		)) as ActionResult;

		expect(result.status).toBe(400);
		expect(mockInsert).not.toHaveBeenCalled();
	});
});
