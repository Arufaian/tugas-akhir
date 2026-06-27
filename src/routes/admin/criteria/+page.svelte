<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { columns } from './columns.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Ruler, ArrowUp, ArrowDown, Plus, RotateCcw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	let { data } = $props();

	let recalculating = $state(false);

	const typeOptions = [
		{ value: 'benefit', label: 'Benefit' },
		{ value: 'cost', label: 'Cost' }
	];

	const inputTypeOptions = [
		{ value: 'number', label: 'Angka' },
		{ value: 'scale', label: 'Skala' },
		{ value: 'tech_features', label: 'Fitur' }
	];

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Tidak' }
	];
</script>

<svelte:head>
	<title>Kriteria</title>
</svelte:head>

<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Ruler class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Total Kriteria</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.total}
			</span>
			<span class="text-xs text-muted-foreground/70">kriteria</span>
			<Button
				variant="outline"
				size="sm"
				class="text-primary hover:bg-primary/10"
				href="/admin/criteria/create"
			>
				<Plus class="size-3.5" />
				Tambah
			</Button>
			<form
				method="POST"
				action="?/normalize"
				use:enhance={() => {
					recalculating = true;
					return async ({ result }) => {
						recalculating = false;
						if (result.type === 'success' && (result.data as { success?: boolean })?.success) {
							toast.success('Bobot berhasil dihitung ulang');
							await invalidateAll();
						} else if (result.type === 'failure') {
							toast.error(
								(result.data as { error?: string })?.error ?? 'Gagal menghitung ulang bobot'
							);
						}
					};
				}}
			>
				<Button
					variant="outline"
					class="w-full text-primary hover:bg-primary/10"
					type="submit"
					disabled={recalculating}
				>
					{#if recalculating}
						<Spinner class="size-3.5" />
						Menghitung...
					{:else}
						<RotateCcw class="size-3.5" />
						Hitung Ulang Bobot
					{/if}
				</Button>
				{#if data.needsNormalization}
					<div class="flex items-center gap-1.5">
						<span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-warning"></span>
						<span class="text-xs text-muted-foreground">Bobot perlu disesuaikan</span>
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>

	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-success/10 text-success">
					<ArrowUp class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Benefit</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.benefitCount}
			</span>
			<span class="text-xs text-muted-foreground/70">kriteria</span>
		</CardContent>
	</Card>

	<Card size="sm">
		<CardContent class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-md bg-warning/10 text-warning">
					<ArrowDown class="size-4" />
				</div>
				<span class="text-sm font-medium text-muted-foreground">Cost</span>
			</div>
			<span
				class="font-display text-3xl leading-none font-semibold tracking-tighter text-foreground"
			>
				{data.costCount}
			</span>
			<span class="text-xs text-muted-foreground/70">kriteria</span>
		</CardContent>
	</Card>
</div>

<div class="rounded-xl border bg-card">
	<DataTable
		data={data.criteria}
		{columns}
		filterColumn="name"
		filterPlaceholder="Cari kriteria..."
		facetedFilters={[
			{ columnId: 'type', title: 'Tipe', options: typeOptions },
			{ columnId: 'inputType', title: 'Input', options: inputTypeOptions },
			{ columnId: 'Status', title: 'Status', options: statusOptions }
		]}
	/>
</div>
