import type { Column, ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	renderComponent,
	renderSnippet,
	DataTableColumnHeader
} from '$lib/components/ui/data-table/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import type { Criterion } from '$lib/validations/criterion.schema.js';

export const columns: ColumnDef<Criterion>[] = [
	{
		accessorKey: 'code',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Kode'
			})
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Nama'
			})
	},
	{
		accessorKey: 'type',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Tipe'
			}),
		cell: ({ row }) => {
			const type = row.original.type;
			const label = type === 'benefit' ? 'Benefit' : 'Cost';
			const children = createRawSnippet(() => ({
				render: () => `<span>${label}</span>`
			}));
			return renderComponent(Badge, {
				variant: type === 'benefit' ? 'success' : 'warning',
				children
			});
		},
		filterFn: (row, _columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			return filterValue.includes(row.original.type);
		}
	},
	{
		id: 'inputType',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Input'
			}),
		cell: ({ row }) => {
			const type = row.original.inputType;
			const labels: Record<string, string> = {
				number: 'Angka',
				scale: 'Skala',
				tech_features: 'Fitur'
			};
			const children = createRawSnippet(() => ({
				render: () => `<span>${labels[type] ?? type}</span>`
			}));
			return renderComponent(Badge, { variant: 'secondary', children });
		},
		filterFn: (row, _columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			return filterValue.includes(row.original.inputType);
		}
	},
	{
		accessorKey: 'rawWeight',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column: column as Column<unknown, unknown>,
				title: 'Bobot'
			})
	},
	{
		accessorKey: 'isActive',
		id: 'Status',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.original.isActive;
			const children = createRawSnippet(() => ({
				render: () => `<span>${isActive ? 'Aktif' : 'Tidak'}</span>`
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
	}
];
