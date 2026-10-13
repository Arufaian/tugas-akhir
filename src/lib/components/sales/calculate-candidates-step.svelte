<script lang="ts">
	import { ArrowLeft, Calculator, CircleAlert, Motorbike } from '@lucide/svelte';
	import type { SuperForm } from 'sveltekit-superforms';

	import yamahaLogo from '$lib/assets/favicon1.png';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Stepper from '$lib/components/ui/stepper/index.js';
	import type { SalesCalculationInput } from '$lib/validations/sales-calculation.schema.js';

	import { type CatalogAlternative, formatCurrency } from './types.js';

	interface Props {
		filteredAlternatives: CatalogAlternative[];
		selectedCategoryLabel: string;
		priceRange: [number, number];
		calculationIssues: string[];
		hasIncompleteCandidates: boolean;
		submitting: boolean;
		enhance: SuperForm<SalesCalculationInput>['enhance'];
	}

	let {
		filteredAlternatives,
		selectedCategoryLabel,
		priceRange,
		calculationIssues,
		hasIncompleteCandidates,
		submitting,
		enhance
	}: Props = $props();
</script>

<section class="flex flex-col gap-6" aria-labelledby="candidate-title">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex flex-col gap-1">
			<h2 id="candidate-title" class="font-display text-2xl font-semibold tracking-tight">
				{filteredAlternatives.length} motor ditemukan
			</h2>
			<p class="text-sm text-muted-foreground">
				Seluruh motor berikut akan dibandingkan menggunakan bobot yang sama.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary">{selectedCategoryLabel}</Badge>
			<Badge variant="outline">
				{formatCurrency(priceRange[0])}–{formatCurrency(priceRange[1])}
			</Badge>
		</div>
	</header>

	{#if calculationIssues.length}
		<Alert.Root variant="destructive">
			<CircleAlert />
			<Alert.Title>Perhitungan belum dapat dijalankan</Alert.Title>
			<Alert.Description>
				<ul class="list-inside list-disc">
					{#each calculationIssues as issue (issue)}
						<li>{issue}</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if filteredAlternatives.length === 0}
		<Empty.Root class="min-h-80 border border-dashed">
			<Empty.Header>
				<Empty.Media variant="icon"><Motorbike /></Empty.Media>
				<Empty.Title>Tidak ada motor yang sesuai</Empty.Title>
				<Empty.Description>
					Perluas rentang harga atau pilih kategori lain untuk menemukan kandidat.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		{#if filteredAlternatives.length === 1}
			<Alert.Root>
				<CircleAlert />
				<Alert.Title>Butuh satu pembanding lagi</Alert.Title>
				<Alert.Description>
					Perhitungan MOORA memerlukan minimal dua motor. Perluas filter sebelum melanjutkan.
				</Alert.Description>
			</Alert.Root>
		{/if}
		{#if hasIncompleteCandidates}
			<Alert.Root variant="destructive">
				<CircleAlert />
				<Alert.Title>Data kandidat belum lengkap</Alert.Title>
				<Alert.Description>
					Minta admin melengkapi seluruh nilai kriteria sebelum menjalankan perhitungan.
				</Alert.Description>
			</Alert.Root>
		{/if}

		<Item.Group class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each filteredAlternatives as alternative (alternative.id)}
				<Item.Root variant="outline" role="listitem" class="overflow-hidden p-0">
					<Item.Header class="aspect-4/3 bg-muted/40 p-5">
						<img
							src={alternative.imageUrl ?? yamahaLogo}
							alt={`Yamaha ${alternative.name}`}
							class="h-full w-full object-contain"
						/>
					</Item.Header>
					<Item.Content class="basis-full gap-3 px-4 pb-4">
						<div class="flex items-start justify-between gap-3">
							<div class="flex min-w-0 flex-col gap-1">
								<Item.Description>{alternative.code}</Item.Description>
								<Item.Title class="line-clamp-2 text-base">
									{alternative.name}
								</Item.Title>
							</div>
							<Badge variant="secondary">{alternative.category}</Badge>
						</div>
						<p class="font-mono text-lg font-semibold tabular-nums">
							{formatCurrency(alternative.price)}
						</p>
					</Item.Content>
				</Item.Root>
			{/each}
		</Item.Group>
	{/if}

	<div class="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-between">
		<Stepper.Previous>
			{#snippet child({ props })}
				<Button {...props} type="button" class="w-full sm:w-auto">
					<ArrowLeft data-icon="inline-start" />
					Kembali ke kebutuhan
				</Button>
			{/snippet}
		</Stepper.Previous>
		<form method="POST" action="?/calculate" use:enhance class="w-full sm:w-auto">
			<Button
				type="submit"
				class="w-full sm:w-auto"
				disabled={filteredAlternatives.length < 2 || hasIncompleteCandidates || submitting}
			>
				{#if submitting}
					<Spinner data-icon="inline-start" />
					Menghitung...
				{:else}
					<Calculator data-icon="inline-start" />
					Hitung {filteredAlternatives.length} motor
				{/if}
			</Button>
		</form>
	</div>
</section>
