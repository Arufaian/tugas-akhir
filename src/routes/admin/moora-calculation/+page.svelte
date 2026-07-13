<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		ArrowLeft,
		ArrowRight,
		Calculator,
		CalendarClock,
		CircleCheck,
		Divide,
		ListChecks,
		Scale,
		Table as TableIcon,
		Trophy
	} from '@lucide/svelte';

	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Stepper from '$lib/components/ui/stepper/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	import type { PageProps } from './$types.js';

	const stages = [
		{
			id: 'decision',
			title: 'Keputusan',
			navDescription: 'Nilai awal',
			heading: 'Matriks Keputusan',
			description: 'Nilai awal setiap alternatif terhadap seluruh kriteria aktif.',
			icon: TableIcon
		},
		{
			id: 'normalized',
			title: 'Normalisasi',
			navDescription: 'Samakan skala',
			heading: 'Matriks Normalisasi',
			description: 'Nilai awal dibagi denominator agar setiap kriteria dapat dibandingkan.',
			icon: Divide
		},
		{
			id: 'weighted',
			title: 'Terbobot',
			navDescription: 'Terapkan bobot',
			heading: 'Matriks Normalisasi Terbobot',
			description: 'Nilai normal dikalikan dengan bobot masing-masing kriteria.',
			icon: Scale
		},
		{
			id: 'optimization',
			title: 'Optimasi',
			navDescription: 'Benefit − cost',
			heading: 'Nilai Optimasi',
			description: 'Total cost dikurangkan dari total benefit untuk menghasilkan nilai Yi.',
			icon: Trophy
		}
	] as const;

	const runDateFormatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	});

	let { data }: PageProps = $props();
	let activeTab = $state('results');
	let step = $state(1);
	let isCalculating = $state(false);
	let currentStage = $derived(stages[step - 1]);
	let alternativesById = $derived(
		new Map(data.alternatives.map((alternative) => [alternative.id, alternative]))
	);

	function formatDecimal(value: number, digits = 6) {
		return value.toLocaleString('id-ID', {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
	}

	function formatRawValue(value: number) {
		return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
	}

	// ponytail: UI-only simulation; replace with the calculate form action.
	async function simulateCalculation() {
		isCalculating = true;
		await new Promise((resolve) => setTimeout(resolve, 600));
		toast.success('Perhitungan mock selesai');
		isCalculating = false;
	}
</script>

<svelte:head>
	<title>Perhitungan MOORA</title>
	<meta
		name="description"
		content="Jalankan dan audit perhitungan MOORA untuk menentukan peringkat alternatif."
	/>
</svelte:head>

<div class="flex min-w-0 flex-col gap-4">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 flex-col gap-1">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="font-display text-2xl font-semibold tracking-tight">Perhitungan MOORA</h1>
				<Badge variant={data.readiness.isReady ? 'success' : 'warning'}>
					<CircleCheck data-icon="inline-start" />
					{data.readiness.isReady ? 'Siap dihitung' : 'Perlu diperiksa'}
				</Badge>
			</div>
			<p class="text-sm text-muted-foreground">
				Hitung dan audit peringkat alternatif berdasarkan kriteria aktif.
			</p>
		</div>

		<Button disabled={!data.readiness.isReady || isCalculating} onclick={simulateCalculation}>
			{#if isCalculating}
				<Spinner data-icon="inline-start" />
				Menghitung...
			{:else}
				<Calculator data-icon="inline-start" />
				Hitung MOORA
			{/if}
		</Button>
	</header>

	<Card.Root size="sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<CalendarClock />
				Run terbaru
			</Card.Title>
			<Card.Description>
				{data.run.name} · {runDateFormatter.format(data.run.createdAt)} WIB
			</Card.Description>
			<Card.Action>
				<Badge variant="outline">Mock data</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content class="flex flex-wrap items-center gap-3 text-sm">
			<div class="flex items-center gap-2">
				<ListChecks class="text-muted-foreground" />
				<span><strong>{data.run.alternativeCount}</strong> alternatif</span>
			</div>
			<Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
			<div><strong>{data.run.criteriaCount}</strong> kriteria</div>
			<Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
			<div class="text-muted-foreground">oleh {data.run.createdByName}</div>
		</Card.Content>
	</Card.Root>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List variant="line" class="w-full">
			<Tabs.Trigger value="results">
				<Trophy data-icon="inline-start" />
				Hasil & Peringkat
			</Tabs.Trigger>
			<Tabs.Trigger value="details">
				<ListChecks data-icon="inline-start" />
				Rincian Perhitungan
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="results">
			<Card.Root>
				<Card.Header>
					<Card.Title>Hasil Peringkat</Card.Title>
					<Card.Description>Alternatif diurutkan dari nilai optimasi tertinggi.</Card.Description>
				</Card.Header>
				<Card.Content class="px-0">
					<Table.Root>
						<Table.Caption class="sr-only">
							Peringkat alternatif berdasarkan hasil perhitungan MOORA.
						</Table.Caption>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-20 ps-6">Rank</Table.Head>
								<Table.Head>Alternatif</Table.Head>
								<Table.Head class="text-right">Benefit</Table.Head>
								<Table.Head class="text-right">Cost</Table.Head>
								<Table.Head class="pe-6 text-right">Nilai Yi</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.results as result (result.alternativeId)}
								{@const alternative = alternativesById.get(result.alternativeId)}
								{#if alternative}
									<Table.Row
										class={result.rank === 1 ? 'bg-primary/5 hover:bg-primary/10' : undefined}
									>
										<Table.Cell class="ps-6">
											<Badge variant={result.rank === 1 ? 'default' : 'outline'}>
												#{result.rank}
											</Badge>
										</Table.Cell>
										<Table.Cell>
											<div class="flex min-w-52 items-center gap-2">
												<Badge variant="secondary">{alternative.code}</Badge>
												<div class="flex min-w-0 flex-col">
													<span class="truncate font-medium">{alternative.name}</span>
													<span class="text-xs text-muted-foreground">{alternative.category}</span>
												</div>
											</div>
										</Table.Cell>
										<Table.Cell class="text-right font-mono tabular-nums">
											{formatDecimal(result.totalBenefit)}
										</Table.Cell>
										<Table.Cell class="text-right font-mono tabular-nums">
											{formatDecimal(result.totalCost)}
										</Table.Cell>
										<Table.Cell class="pe-6 text-right font-mono font-semibold tabular-nums">
											{formatDecimal(result.optimizationScore)}
										</Table.Cell>
									</Table.Row>
								{/if}
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="details">
			<Card.Root>
				<Card.Header>
					<Card.Title>Tahapan Perhitungan</Card.Title>
					<Card.Description>
						Ikuti transformasi nilai dari matriks keputusan sampai nilai optimasi.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex min-w-0 flex-col gap-6">
					<Stepper.Root bind:step>
						<Stepper.Nav
							orientation="horizontal"
							class="mx-auto w-full max-w-4xl overflow-x-auto px-2 pb-2 sm:px-4"
						>
							{#each stages as stage (stage.id)}
								<Stepper.Item id={stage.id} class="min-w-16">
									<Stepper.Trigger
										class="flex w-full flex-col items-center lg:w-40"
										aria-label={`${stage.title}: ${stage.navDescription}`}
									>
										<Stepper.Indicator>
											<stage.icon />
										</Stepper.Indicator>
										<div class="hidden flex-col lg:flex">
											<Stepper.Title class="text-sm">{stage.title}</Stepper.Title>
											<Stepper.Description>{stage.navDescription}</Stepper.Description>
										</div>
									</Stepper.Trigger>
									<Stepper.Separator class="left-[calc(50%-0.875rem)] lg:left-16.5" />
								</Stepper.Item>
							{/each}
						</Stepper.Nav>

						<section class="flex min-w-0 flex-col gap-4" aria-labelledby="matrix-title">
							<div>
								<h2 id="matrix-title" class="font-display text-lg font-semibold">
									{currentStage.heading}
								</h2>
								<p class="text-sm text-muted-foreground">{currentStage.description}</p>
							</div>

							{#if step < 4}
								<div class="rounded-lg border">
									<Table.Root class="min-w-272">
										<Table.Caption class="sr-only">
											{currentStage.heading} untuk lima alternatif dan tujuh kriteria.
										</Table.Caption>
										<Table.Header>
											<Table.Row>
												<Table.Head class="sticky left-0 min-w-56 bg-card ps-4">
													Alternatif
												</Table.Head>
												{#each data.criteria as criterion (criterion.id)}
													<Table.Head class="min-w-32 text-right align-top">
														<div class="flex flex-col items-end gap-1 py-2">
															<div class="flex items-center gap-1">
																<Badge variant="outline">{criterion.code}</Badge>
																<Badge
																	variant={criterion.type === 'benefit' ? 'success' : 'warning'}
																>
																	{criterion.type === 'benefit' ? 'Benefit' : 'Cost'}
																</Badge>
															</div>
															<span class="max-w-36 text-wrap">{criterion.name}</span>
															<span class="text-xs font-normal text-muted-foreground">
																{criterion.unit} · {(criterion.weight * 100).toFixed(2)}%
															</span>
														</div>
													</Table.Head>
												{/each}
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each data.matrixRows as row (row.alternativeId)}
												{@const alternative = alternativesById.get(row.alternativeId)}
												{#if alternative}
													<Table.Row>
														<Table.Cell class="sticky left-0 bg-card ps-4">
															<div class="flex items-center gap-2">
																<Badge variant="secondary">{alternative.code}</Badge>
																<span class="font-medium">{alternative.name}</span>
															</div>
														</Table.Cell>
														{#each data.criteria as criterion, criterionIndex (criterion.id)}
															<Table.Cell class="text-right font-mono tabular-nums">
																{#if step === 1}
																	<div class="flex flex-col items-end">
																		<span>{formatRawValue(row.raw[criterionIndex])}</span>
																		{#if row.labels[criterionIndex]}
																			<span
																				class="max-w-32 truncate font-sans text-xs text-muted-foreground"
																				title={row.labels[criterionIndex] ?? undefined}
																			>
																				{row.labels[criterionIndex]}
																			</span>
																		{/if}
																	</div>
																{:else if step === 2}
																	{formatDecimal(row.normalized[criterionIndex])}
																{:else}
																	{formatDecimal(row.weighted[criterionIndex])}
																{/if}
															</Table.Cell>
														{/each}
													</Table.Row>
												{/if}
											{/each}
										</Table.Body>
										{#if step === 2}
											<Table.Footer>
												<Table.Row>
													<Table.Cell class="sticky left-0 bg-muted ps-4 font-medium">
														Denominator
													</Table.Cell>
													{#each data.criteria as criterion (criterion.id)}
														<Table.Cell class="text-right font-mono tabular-nums">
															{formatDecimal(criterion.denominator)}
														</Table.Cell>
													{/each}
												</Table.Row>
											</Table.Footer>
										{/if}
									</Table.Root>
								</div>
							{:else}
								<div class="rounded-lg border">
									<Table.Root>
										<Table.Caption class="sr-only">
											Nilai optimasi benefit dikurangi cost untuk setiap alternatif.
										</Table.Caption>
										<Table.Header>
											<Table.Row>
												<Table.Head class="ps-4">Alternatif</Table.Head>
												<Table.Head class="text-right">Total Benefit</Table.Head>
												<Table.Head class="text-right">Total Cost</Table.Head>
												<Table.Head class="pe-4 text-right">Nilai Yi</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each data.results as result (result.alternativeId)}
												{@const alternative = alternativesById.get(result.alternativeId)}
												{#if alternative}
													<Table.Row>
														<Table.Cell class="ps-4">
															<div class="flex items-center gap-2">
																<Badge variant="secondary">{alternative.code}</Badge>
																<span class="font-medium">{alternative.name}</span>
															</div>
														</Table.Cell>
														<Table.Cell class="text-right font-mono tabular-nums">
															{formatDecimal(result.totalBenefit)}
														</Table.Cell>
														<Table.Cell class="text-right font-mono tabular-nums">
															{formatDecimal(result.totalCost)}
														</Table.Cell>
														<Table.Cell
															class="pe-4 text-right font-mono font-semibold tabular-nums"
														>
															{formatDecimal(result.optimizationScore)}
														</Table.Cell>
													</Table.Row>
												{/if}
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							{/if}

							<div class="flex items-center justify-between gap-3">
								<Stepper.Previous>
									<ArrowLeft data-icon="inline-start" />
									Sebelumnya
								</Stepper.Previous>
								<span class="text-xs text-muted-foreground">Tahap {step} dari {stages.length}</span>
								<Stepper.Next>
									Selanjutnya
									<ArrowRight data-icon="inline-end" />
								</Stepper.Next>
							</div>
						</section>
					</Stepper.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
