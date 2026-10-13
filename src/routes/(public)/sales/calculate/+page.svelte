<script lang="ts">
	import { Motorbike, SlidersHorizontal, Trophy } from '@lucide/svelte';
	import { type FormResult, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import {
		CalculateCandidatesStep,
		CalculateNeedsStep,
		CalculateResultsStep,
		type CalculationData
	} from '$lib/components/sales/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Stepper from '$lib/components/ui/stepper/index.js';
	import { salesCalculationSchema } from '$lib/validations/sales-calculation.schema.js';

	import type { ActionData, PageProps } from './$types.js';

	let { data }: PageProps = $props();
	let step = $state(1);
	let reviewedFilterKey = $state<string | null>(null);
	let calculatedFilterKey = $state<string | null>(null);
	let calculation = $state.raw<CalculationData | null>(null);
	let calculationIssues = $state.raw<string[]>([]);

	const initialForm = () => data.form;
	const form = superForm(initialForm(), {
		dataType: 'json',
		validators: zod4Client(salesCalculationSchema),
		multipleSubmits: 'prevent',
		resetForm: false,
		invalidateAll: false,
		onUpdate({ form: updatedForm, result }) {
			const resultData = result.data as FormResult<ActionData>;
			const issues = resultData && 'issues' in resultData ? resultData.issues : undefined;

			calculationIssues = Array.isArray(issues)
				? issues.filter((issue): issue is string => typeof issue === 'string')
				: [];
			if (!updatedForm.valid || !resultData?.calculation) {
				if (updatedForm.errors.category || updatedForm.errors.priceRange) step = 1;
				return;
			}

			calculation = resultData.calculation;
			const { category, priceRange } = calculation.filter;
			reviewedFilterKey = `${category}:${priceRange[0]}:${priceRange[1]}`;
			calculatedFilterKey = reviewedFilterKey;
			step = 3;
		}
	});
	const { form: formData, enhance, submitting } = form;

	let catalogPriceRange = $derived(data.priceRange ?? [0, 0]);
	let categoryOptions = $derived([
		{ value: 'all', label: 'Semua kategori' },
		...data.categories.map((category) => ({ value: category, label: category }))
	]);
	let selectedCategoryLabel = $derived(
		categoryOptions.find((option) => option.value === $formData.category)?.label ?? 'Semua kategori'
	);
	let filterKey = $derived(
		`${$formData.category}:${$formData.priceRange[0]}:${$formData.priceRange[1]}`
	);
	let filteredAlternatives = $derived(
		data.catalog.filter(
			(alternative) =>
				($formData.category === 'all' || alternative.category === $formData.category) &&
				alternative.price >= $formData.priceRange[0] &&
				alternative.price <= $formData.priceRange[1]
		)
	);
	let hasIncompleteCandidates = $derived(
		filteredAlternatives.some((alternative) => !alternative.isComplete)
	);
	let rankedAlternatives = $derived(calculation?.results ?? []);
	let canAccessCandidates = $derived(reviewedFilterKey === filterKey);
	let canAccessResults = $derived(
		calculatedFilterKey === filterKey && rankedAlternatives.length >= 2
	);

	function invalidateResult() {
		reviewedFilterKey = null;
		calculatedFilterKey = null;
		calculation = null;
		calculationIssues = [];
	}

	function resetFilters() {
		$formData.category = 'all';
		$formData.priceRange = [catalogPriceRange[0], catalogPriceRange[1]];
		invalidateResult();
	}

	function showCandidates() {
		if (!data.priceRange || data.issues.length) return;

		reviewedFilterKey = filterKey;
		step = 2;
	}
</script>

<svelte:head>
	<title>Kalkulasi Motor Sales</title>
	<meta
		name="description"
		content="Simulasi pemilihan motor berdasarkan kategori dan rentang anggaran pelanggan."
	/>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
	<header class="flex max-w-3xl flex-col items-start gap-4">
		<Badge variant="outline">
			<Motorbike data-icon="inline-start" />
			Simulasi Perhitungan MOORA
		</Badge>
		<div class="flex flex-col gap-2">
			<h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
				Pilih motor sesuai kategori dan rentang anggaran
			</h1>
			<p class="max-w-2xl leading-7 text-muted-foreground">
				filter berdasarkan kategori dan anggaran, tinjau kandidatnya, lalu gunakan hasil MOORA
				sebagai dasar rekomendasi.
			</p>
		</div>
	</header>

	<Stepper.Root bind:step>
		<Stepper.Nav orientation="horizontal" class="mx-auto w-full max-w-3xl px-2">
			<Stepper.Item id="needs" class="min-w-0 flex-1">
				<Stepper.Trigger class="w-full items-center" aria-label="Tahap 1: Kebutuhan">
					<Stepper.Indicator><SlidersHorizontal /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Kebutuhan</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Kategori & anggaran
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator class="left-[calc(50%-0.875rem)]" />
			</Stepper.Item>

			<Stepper.Item id="candidates" class="min-w-0 flex-1">
				<Stepper.Trigger
					class="w-full items-center"
					disabled={!canAccessCandidates}
					aria-label="Tahap 2: Kandidat"
				>
					<Stepper.Indicator><Motorbike /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Kandidat</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Motor yang sesuai
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator class="left-[calc(50%-0.875rem)]" />
			</Stepper.Item>

			<Stepper.Item id="results" class="min-w-0 flex-1">
				<Stepper.Trigger
					class="w-full items-center"
					disabled={!canAccessResults}
					aria-label="Tahap 3: Hasil"
				>
					<Stepper.Indicator><Trophy /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Hasil</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Rekomendasi MOORA
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator class="left-[calc(50%-0.875rem)]" />
			</Stepper.Item>
		</Stepper.Nav>

		<div class="mt-8">
			{#if step === 1}
				<CalculateNeedsStep
					{form}
					{formData}
					catalogPriceRange={data.priceRange}
					{categoryOptions}
					{selectedCategoryLabel}
					filteredAlternativesCount={filteredAlternatives.length}
					issues={data.issues}
					onResetFilters={resetFilters}
					onShowCandidates={showCandidates}
					onInvalidateResult={invalidateResult}
				/>
			{:else if step === 2}
				<CalculateCandidatesStep
					{filteredAlternatives}
					{selectedCategoryLabel}
					priceRange={$formData.priceRange}
					{calculationIssues}
					{hasIncompleteCandidates}
					submitting={$submitting}
					{enhance}
				/>
			{:else if step === 3 && calculation}
				<CalculateResultsStep
					{calculation}
					{selectedCategoryLabel}
					priceRange={$formData.priceRange}
					onNavigateStep={(targetStep) => (step = targetStep)}
				/>
			{/if}
		</div>
	</Stepper.Root>
</main>
