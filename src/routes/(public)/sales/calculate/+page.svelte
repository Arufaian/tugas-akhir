<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		Calculator,
		CircleAlert,
		Motorbike,
		RotateCcw,
		SlidersHorizontal,
		Trophy
	} from '@lucide/svelte';

	import yamahaLogo from '$lib/assets/favicon1.png';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Stepper from '$lib/components/ui/stepper/index.js';
	import { filterAlternatives, mockAlternatives, rankAlternatives } from './mock.js';

	const categoryOptions = [
		{ value: 'all', label: 'Semua kategori' },
		{ value: 'Classy', label: 'Classy' },
		{ value: 'Matic', label: 'Matic' },
		{ value: 'MAXi', label: 'MAXi' },
		{ value: 'Moped', label: 'Moped' },
		{ value: 'Sport', label: 'Sport' },
		{ value: 'Off-Road', label: 'Off-Road' }
	];
	const catalogPriceRange = [18_000_000, 69_000_000];
	const currencyFormatter = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	});
	const scoreFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 6,
		maximumFractionDigits: 6
	});

	let step = $state(1);
	let selectedCategory = $state('all');
	let priceRange = $state<number[]>([...catalogPriceRange]);
	let reviewedFilterKey = $state<string | null>(null);
	let calculatedFilterKey = $state<string | null>(null);

	let selectedCategoryLabel = $derived(
		categoryOptions.find((option) => option.value === selectedCategory)?.label ?? 'Semua kategori'
	);
	let filterKey = $derived(`${selectedCategory}:${priceRange[0]}:${priceRange[1]}`);
	let filteredAlternatives = $derived(
		filterAlternatives(mockAlternatives, selectedCategory, priceRange)
	);
	let rankedAlternatives = $derived(rankAlternatives(filteredAlternatives));
	let winner = $derived(rankedAlternatives[0]);
	let canAccessCandidates = $derived(reviewedFilterKey === filterKey);
	let canAccessResults = $derived(
		calculatedFilterKey === filterKey && rankedAlternatives.length >= 2
	);

	function invalidateResult() {
		reviewedFilterKey = null;
		calculatedFilterKey = null;
	}

	function resetFilters() {
		selectedCategory = 'all';
		priceRange = [...catalogPriceRange];
		invalidateResult();
	}

	function showCandidates() {
		reviewedFilterKey = filterKey;
		step = 2;
	}

	function calculateMockResult() {
		if (filteredAlternatives.length < 2) return;

		reviewedFilterKey = filterKey;
		calculatedFilterKey = filterKey;
		step = 3;
	}

	function formatCurrency(value: number): string {
		return currencyFormatter.format(value);
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
			UI Mock
		</Badge>
		<div class="flex flex-col gap-2">
			<p class="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
				Konsultasi Penjualan
			</p>
			<h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
				Temukan motor yang masuk kebutuhan pelanggan.
			</h1>
			<p class="max-w-2xl leading-7 text-muted-foreground">
				Saring berdasarkan kategori dan anggaran, tinjau kandidatnya, lalu gunakan hasil MOORA
				sebagai dasar rekomendasi.
			</p>
		</div>
	</header>

	<Stepper.Root bind:step>
		<Stepper.Nav orientation="horizontal" class="mx-auto w-full max-w-3xl px-2">
			<Stepper.Item id="needs" class="min-w-0">
				<Stepper.Trigger class="items-center" aria-label="Tahap 1: Kebutuhan">
					<Stepper.Indicator><SlidersHorizontal /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Kebutuhan</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Kategori & anggaran
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator />
			</Stepper.Item>

			<Stepper.Item id="candidates" class="min-w-0">
				<Stepper.Trigger
					class="items-center"
					disabled={!canAccessCandidates}
					aria-label="Tahap 2: Kandidat"
				>
					<Stepper.Indicator><Motorbike /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Kandidat</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Motor yang sesuai
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator />
			</Stepper.Item>

			<Stepper.Item id="results" class="min-w-0">
				<Stepper.Trigger
					class="items-center"
					disabled={!canAccessResults}
					aria-label="Tahap 3: Hasil"
				>
					<Stepper.Indicator><Trophy /></Stepper.Indicator>
					<Stepper.Title class="mt-2 text-xs sm:text-sm">Hasil</Stepper.Title>
					<Stepper.Description class="hidden text-xs md:block">
						Rekomendasi MOORA
					</Stepper.Description>
				</Stepper.Trigger>
				<Stepper.Separator />
			</Stepper.Item>
		</Stepper.Nav>

		<div class="mt-8">
			{#if step === 1}
				<Card.Root class="mx-auto w-full max-w-3xl">
					<Card.Header>
						<Card.Title>Kebutuhan pelanggan</Card.Title>
						<Card.Description>
							Tentukan kategori motor dan batas anggaran yang sedang dipertimbangkan.
						</Card.Description>
					</Card.Header>

					<Card.Content>
						<Field.Group>
							<Field.Field>
								<Field.Label for="motor-category">Kategori motor</Field.Label>
								<Select.Root
									type="single"
									name="category"
									bind:value={selectedCategory}
									onValueChange={invalidateResult}
								>
									<Select.Trigger id="motor-category" class="w-full">
										{selectedCategoryLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Kategori</Select.Label>
											{#each categoryOptions as option (option.value)}
												<Select.Item value={option.value} label={option.label}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<Field.Description>
									Pilih semua kategori jika pelanggan belum menentukan jenis motor.
								</Field.Description>
							</Field.Field>

							<Field.Separator />

							<Field.Field>
								<div class="flex flex-wrap items-start justify-between gap-3">
									<Field.Content>
										<Field.Label id="budget-label">Anggaran pelanggan</Field.Label>
										<Field.Description>
											Geser kedua titik untuk menentukan harga minimum dan maksimum.
										</Field.Description>
									</Field.Content>
									<Badge variant={filteredAlternatives.length >= 2 ? 'success' : 'warning'}>
										{filteredAlternatives.length} motor sesuai
									</Badge>
								</div>

								<div class="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4">
									<div class="flex min-w-0 flex-col gap-1">
										<span class="text-xs text-muted-foreground">Minimum</span>
										<span
											class="truncate font-mono text-base font-semibold tabular-nums sm:text-lg"
										>
											{formatCurrency(priceRange[0])}
										</span>
									</div>
									<div class="flex min-w-0 flex-col gap-1 text-right">
										<span class="text-xs text-muted-foreground">Maksimum</span>
										<span
											class="truncate font-mono text-base font-semibold tabular-nums sm:text-lg"
										>
											{formatCurrency(priceRange[1])}
										</span>
									</div>
								</div>

								<Slider
									type="multiple"
									bind:value={priceRange}
									onValueChange={invalidateResult}
									min={catalogPriceRange[0]}
									max={catalogPriceRange[1]}
									step={100_000}
									aria-labelledby="budget-label"
									class="my-2"
								/>

								<div class="flex justify-between gap-4 text-xs text-muted-foreground">
									<span>{formatCurrency(catalogPriceRange[0])}</span>
									<span>{formatCurrency(catalogPriceRange[1])}</span>
								</div>
							</Field.Field>
						</Field.Group>
					</Card.Content>

					<Card.Footer class="flex-col-reverse gap-2 border-t sm:flex-row sm:justify-between">
						<Button type="button" variant="ghost" class="w-full sm:w-auto" onclick={resetFilters}>
							<RotateCcw data-icon="inline-start" />
							Reset rentang
						</Button>
						<Button type="button" class="w-full sm:w-auto" onclick={showCandidates}>
							Tampilkan {filteredAlternatives.length} kandidat
							<ArrowRight data-icon="inline-end" />
						</Button>
					</Card.Footer>
				</Card.Root>
			{:else if step === 2}
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
									Perhitungan MOORA memerlukan minimal dua motor. Perluas filter sebelum
									melanjutkan.
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
								<Button {...props} class="w-full sm:w-auto">
									<ArrowLeft data-icon="inline-start" />
									Kembali ke kebutuhan
								</Button>
							{/snippet}
						</Stepper.Previous>
						<Button
							type="button"
							class="w-full sm:w-auto"
							disabled={filteredAlternatives.length < 2}
							onclick={calculateMockResult}
						>
							<Calculator data-icon="inline-start" />
							Hitung {filteredAlternatives.length} motor
						</Button>
					</div>
				</section>
			{:else if step === 3 && winner}
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

					<Card.Root class="relative isolate min-h-96">
						<span
							aria-hidden="true"
							class="pointer-events-none absolute -top-6 left-4 text-[8rem] leading-none font-black tracking-tighter text-primary/10 sm:text-[11rem]"
						>
							01
						</span>
						<Card.Header class="relative">
							<Card.Action><Badge variant="success">Rekomendasi utama</Badge></Card.Action>
							<Card.Title class="max-w-xl text-2xl sm:text-3xl">{winner.name}</Card.Title>
							<Card.Description>
								{winner.code} · {winner.category} · {formatCurrency(winner.price)}
							</Card.Description>
						</Card.Header>
						<Card.Content class="relative grid flex-1 items-center gap-8 lg:grid-cols-2">
							<div class="flex flex-col gap-5">
								<div>
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
										Skor optimasi
									</p>
									<p class="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums">
										{scoreFormatter.format(winner.optimizationScore)}
									</p>
								</div>
								<p class="max-w-md leading-6 text-muted-foreground">
									Motor ini memperoleh nilai optimasi tertinggi di antara kandidat yang memenuhi
									kategori dan anggaran pelanggan.
								</p>
							</div>
							<div class="aspect-4/3 rounded-xl bg-muted/40 p-6 sm:p-8">
								<img
									src={winner.imageUrl ?? yamahaLogo}
									alt={`Yamaha ${winner.name}`}
									class="h-full w-full object-contain"
								/>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Peringkat kandidat</Card.Title>
							<Card.Description>
								Diurutkan dari skor optimasi tertinggi ke terendah.
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<Item.Group>
								{#each rankedAlternatives as alternative, index (alternative.id)}
									<Item.Root role="listitem" variant={index === 0 ? 'muted' : 'default'}>
										<Item.Media variant="image">
											<img src={alternative.imageUrl ?? yamahaLogo} alt="" />
										</Item.Media>
										<Item.Content>
											<Item.Title>{alternative.name}</Item.Title>
											<Item.Description>
												{alternative.category} · {formatCurrency(alternative.price)}
											</Item.Description>
										</Item.Content>
										<Item.Actions class="ms-auto flex-col items-end">
											<Badge variant={index === 0 ? 'default' : 'outline'}>#{index + 1}</Badge>
											<span class="font-mono text-xs text-muted-foreground tabular-nums">
												{scoreFormatter.format(alternative.optimizationScore)}
											</span>
										</Item.Actions>
									</Item.Root>
									{#if index < rankedAlternatives.length - 1}<Item.Separator />{/if}
								{/each}
							</Item.Group>
						</Card.Content>
					</Card.Root>

					<Separator />
					<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
						<Button
							type="button"
							variant="outline"
							class="w-full sm:w-auto"
							onclick={() => (step = 1)}
						>
							<SlidersHorizontal data-icon="inline-start" />
							Ubah kebutuhan
						</Button>
						<Button type="button" class="w-full sm:w-auto" onclick={() => (step = 2)}>
							<Motorbike data-icon="inline-start" />
							Lihat kandidat
						</Button>
					</div>
				</section>
			{/if}
		</div>
	</Stepper.Root>
</main>
