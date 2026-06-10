<script lang="ts">
	import DataTable from './data-table.svelte';
	import { columns } from './columns.js';

	let { data } = $props();
</script>

<div class=" rounded-xl border bg-card">
	<DataTable data={data.payments} {columns} />
</div>
