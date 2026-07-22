import type { Column, ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';

import { Badge } from '$lib/components/ui/badge/index.js';
import {
	DataTableColumnHeader,
	renderComponent,
	renderSnippet
} from '$lib/components/ui/data-table/index.js';

import DataTableActions from './data-table-actions.svelte';
import type { UserRow } from './types.js';
import UserIdentityCell from './user-identity-cell.svelte';

const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

export const createColumns = (onEdit: (user: UserRow) => void): ColumnDef<UserRow>[] => [
	{
		id: 'identity',
		accessorFn: (user) => `${user.name} ${user.email}`,
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Pengguna'
			}),
		cell: ({ row }) => renderComponent(UserIdentityCell, { user: row.original })
	},
	{
		accessorKey: 'role',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Role'
			}),
		cell: ({ row }) => {
			const role = row.original.role;
			const children = createRawSnippet(() => ({
				render: () => `<span>${role === 'admin' ? 'Admin' : 'Sales'}</span>`
			}));

			return renderComponent(Badge, {
				variant: role === 'admin' ? 'default' : 'secondary',
				children
			});
		},
		filterFn: (row, _columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			return filterValue.includes(row.original.role);
		}
	},
	{
		accessorKey: 'isActive',
		id: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.original.isActive;
			const children = createRawSnippet(() => ({
				render: () => `<span>${isActive ? 'Aktif' : 'Nonaktif'}</span>`
			}));

			return renderComponent(Badge, {
				variant: isActive ? 'success' : 'destructive',
				children
			});
		},
		filterFn: (row, _columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			return filterValue.includes(String(row.original.isActive));
		}
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Dibuat'
			}),
		cell: ({ row }) => {
			const formattedDate = dateFormatter.format(new Date(row.original.createdAt));
			const date = createRawSnippet(() => ({ render: () => `<span>${formattedDate}</span>` }));

			return renderSnippet(date);
		}
	},
	{
		id: 'actions',
		header: () => {
			const header = createRawSnippet(() => ({
				render: () => '<div class="text-center">Actions</div>'
			}));

			return renderSnippet(header);
		},
		cell: ({ row }) => renderComponent(DataTableActions, { user: row.original, onEdit }),
		enableHiding: false
	}
];
