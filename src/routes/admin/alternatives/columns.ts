import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	renderSnippet,
	renderComponent,
	DataTableColumnHeader
} from '$lib/components/ui/data-table/index.js';
import DataTableActions from './data-table-actions.svelte';
import { Checkbox } from '$lib/components/ui/checkbox/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import type { Alternative } from '$lib/validations/alternative.schema.js';

export const columns: ColumnDef<Alternative>[] = [
	{
		id: 'select',
		header: ({ table }) =>
			renderComponent(Checkbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
				'aria-label': 'Select all'
			}),
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value) => row.toggleSelected(!!value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false
	},

	{
		accessorKey: 'code',
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				column,
				title: 'Code'
			})
	},

	{
		accessorKey: 'name',
		header: 'Name'
	},

	{
		accessorKey: 'imgUrl',
		id: 'Image',
		header: 'Image',
		cell: ({ row }) => {
			const imgUrl = row.original.imgUrl;

			const ImageSnippet = createRawSnippet(() => ({
				render: () =>
					`<img src="${imgUrl}" alt="Gambar Alternatif" class="w-16 h-16 object-cover rounded" />`
			}));
			return renderSnippet(ImageSnippet);
		}
	},

	{
		accessorKey: 'category',
		header: 'Category',
		cell: ({ row }) => row.original.category ?? '—',
		filterFn: (row, columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			const value = row.getValue<string | null>(columnId);
			console.log('🔍 filterFn category:', {
				columnId,
				filterValue,
				value,
				original: row.original
			});
			return value ? filterValue.includes(value) : false;
		}
	},

	{
		accessorKey: 'isActive',
		id: 'Status',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.original.isActive;
			const children = createRawSnippet(() => ({
				render: () => (isActive ? 'Aktif' : 'Tidak')
			}));
			return renderComponent(Badge, {
				variant: 'outline',
				class: isActive
					? 'bg-green-100 text-green-700 border-green-200'
					: 'bg-red-100 text-red-700 border-red-200',
				children
			});
		},
		filterFn: (row, columnId, filterValue: string[]) => {
			if (!filterValue?.length) return true;
			const value = row.getValue<boolean>(columnId);
			return filterValue.includes(String(value));
		}
	},

	{
		id: 'actions',
		header: () => {
			const actionsHeaderSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-center">Actions</div>`
			}));
			return renderSnippet(actionsHeaderSnippet);
		},

		cell: ({ row }) => {
			return renderComponent(DataTableActions, { id: row.original.id });
		},
		enableHiding: false
	}
];
