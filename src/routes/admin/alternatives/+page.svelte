<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { columns } from './columns.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Motorbike, CircleCheck, Tags, Plus } from '@lucide/svelte';

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

	let activePercentage = $derived(
		data.total > 0 ? Math.round((data.activeCount / data.total) * 100) : 0
	);

	let categoryList = $derived(data.categories.join(', '));
</script>

<svelte:head>
	<title>Alternatives</title>
</svelte:head>

<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Motorbike class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Total Motor</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.total}
			</span>
			<span class="text-xs text-muted-foreground/70">motor</span>
			<Button
				variant="outline"
				size="sm"
				class="text-primary hover:bg-primary/10"
				href="/admin/alternatives/create"
			>
				<Plus class="size-3.5" />
				Tambah
			</Button>
		</CardContent>
	</Card>

	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-success/10 text-success">
					<CircleCheck class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Aktif</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.activeCount}
			</span>
			<span class="text-xs text-muted-foreground/70">{activePercentage}% dari total</span>
		</CardContent>
	</Card>

	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-accent/10 text-accent">
					<Tags class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Kategori</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.categories.length}
			</span>
			<span class="truncate text-xs text-muted-foreground/70">{categoryList}</span>
		</CardContent>
	</Card>
</div>

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
