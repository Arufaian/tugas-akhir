<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { columns } from './columns.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>Alternatives</title>
</svelte:head>

<div class="rounded-xl border bg-card">
	<DataTable
		data={data.payments}
		{columns}
		filterColumn="email"
		filterPlaceholder="Filter emails..."
	/>
</div>
