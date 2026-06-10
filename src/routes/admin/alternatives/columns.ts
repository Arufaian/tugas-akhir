import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table/index.js';
import DataTableActions from './data-table-actions.svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { Checkbox } from '$lib/components/ui/checkbox/index.js';
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
		header: 'Kode'
	},

	{
		accessorKey: 'name',
		header: 'Nama'
	},

	{
		accessorKey: 'category',
		header: 'Kategori',
		cell: ({ row }) => {
			const category = row.original.category;
			if (!category) return;

			const snippet = createRawSnippet<[{ value: string }]>((getValue) => {
				const { value } = getValue();
				return {
					render: () => `<span class="capitalize">${value}</span>`
				};
			});
			return renderSnippet(snippet, { value: category });
		}
	},

	{
		accessorKey: 'isActive',
		header: 'Aktif',
		cell: ({ row }) => {
			const isActive = row.original.isActive;
			const snippet = createRawSnippet<[{ active: boolean }]>((getActive) => {
				const { active } = getActive();
				const text = active ? 'Aktif' : 'Tidak';
				const color = active ? 'text-green-600' : 'text-red-500';
				return {
					render: () => `<span class="${color} font-medium">${text}</span>`
				};
			});
			return renderSnippet(snippet, { active: isActive });
		}
	},

	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(DataTableActions, { id: row.original.id });
		}
	}
];
