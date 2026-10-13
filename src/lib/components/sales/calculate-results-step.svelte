<script lang="ts">
	import { CircleAlert, Motorbike, SlidersHorizontal } from '@lucide/svelte';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import CalculateRankingAccordion from './calculate-ranking-accordion.svelte';
	import CalculateWinnerCard from './calculate-winner-card.svelte';
	import { type CalculationData, formatCurrency } from './types.js';

	interface Props {
		calculation: CalculationData;
		selectedCategoryLabel: string;
		priceRange: [number, number];
		onNavigateStep: (step: number) => void;
	}

	let { calculation, selectedCategoryLabel, priceRange, onNavigateStep }: Props = $props();

	let rankedAlternatives = $derived(calculation.results ?? []);
	let winner = $derived(rankedAlternatives[0]);
	let runnerUp = $derived(rankedAlternatives[1]);
	let scoreGap = $derived(
		winner && runnerUp ? winner.optimizationScore - runnerUp.optimizationScore : null
	);
</script>

{#if winner}
	<section class="flex flex-col gap-6" aria-labelledby="result-title">
		<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex flex-col gap-1">
				<h2 id="result-title" class="font-display text-2xl font-semibold tracking-tight">
					Hasil rekomendasi
				</h2>
				<p class="text-sm text-muted-foreground">
					Peringkat berlaku untuk {rankedAlternatives.length} kandidat pada filter ini.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary">{selectedCategoryLabel}</Badge>
				<Badge variant="outline">
					{formatCurrency(priceRange[0])}–{formatCurrency(priceRange[1])}
				</Badge>
			</div>
		</header>

		<CalculateWinnerCard
			{winner}
			{runnerUp}
			totalRanked={rankedAlternatives.length}
			{scoreGap}
		/>

		<CalculateRankingAccordion {rankedAlternatives} />

		<Separator />
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
			<Button
				type="button"
				variant="outline"
				class="w-full sm:w-auto"
				onclick={() => onNavigateStep(1)}
			>
				<SlidersHorizontal data-icon="inline-start" />
				Ubah kebutuhan
			</Button>
			<Button type="button" class="w-full sm:w-auto" onclick={() => onNavigateStep(2)}>
				<Motorbike data-icon="inline-start" />
				Lihat kandidat
			</Button>
		</div>
	</section>
{:else}
	<Alert.Root>
		<CircleAlert />
		<Alert.Title>Hasil kalkulasi tidak tersedia</Alert.Title>
		<Alert.Description>
			Tidak ada hasil rekomendasi yang ditemukan. Silakan sesuaikan kembali kebutuhan.
		</Alert.Description>
	</Alert.Root>
{/if}
