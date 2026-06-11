<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { columns } from './columns.js';

	let { data } = $props();

	const categories = [
		{ value: 'MAXi', label: 'MAXi' },
		{ value: 'Classy', label: 'Classy' },
		{ value: 'Matic', label: 'Matic' },
		{ value: 'Moped', label: 'Moped' },
		{ value: 'Sport', label: 'Sport' },
		{ value: 'Off-Road', label: 'Off-Road' }
	];

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Tidak' }
	];
</script>

<svelte:head>
	<title>Alternatives</title>
</svelte:head>

<div class="rounded-xl border bg-card">
	<DataTable
		data={data.alternatives}
		{columns}
		filterColumn="name"
		filterPlaceholder="Cari nama..."
		facetedFilters={[
			{ columnId: 'category', title: 'Category', options: categories },
			{ columnId: 'Status', title: 'Status', options: statusOptions }
		]}
	/>
</div>
