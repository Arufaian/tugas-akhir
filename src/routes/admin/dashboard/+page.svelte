<script lang="ts">
	import { BarChart } from 'layerchart';
	import {
		ArrowUpRight,
		Calculator,
		ChartNoAxesColumnIncreasing,
		CircleCheck,
		ClipboardList,
		History,
		ListChecks,
		Motorbike,
		OctagonAlert,
		Trophy
	} from '@lucide/svelte';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import type { PageProps } from './$types.js';

	const dateFormatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	});
	const scoreFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 3,
		maximumFractionDigits: 6
	});
	const chartConfig = {
		score: { label: 'Skor optimasi', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let { data }: PageProps = $props();

	const chartData = $derived.by(() => {
		if (!data.latestRun) return [];

		const alternatives = new Map(
			data.latestRun.alternatives.map((alternative) => [alternative.id, alternative])
		);

		return data.latestRun.results.map((result) => {
			const alternative = alternatives.get(result.alternativeId);

			return {
				...result,
				code: alternative?.code ?? '-',
				name: alternative?.name ?? 'Alternative tidak tersedia',
				score: result.optimizationScore
			};
		});
	});
	const chartDomain = $derived.by(() => {
		if (chartData.length === 0) return [0, 1] as [number, number];

		const scores = chartData.map((item) => item.score);
		const min = Math.min(0, ...scores);
		const max = Math.max(0, ...scores);

		return min === max ? [min, min + 1] : ([min, max] as [number, number]);
	});
	const latestDecision = $derived(chartData[0]);
</script>

<svelte:head>
	<title>Dashboard Admin</title>
	<meta name="description" content="Pantau kesiapan data dan hasil perhitungan MOORA terbaru." />
</svelte:head>

<div class="flex min-w-0 flex-col gap-4">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 flex-col gap-1">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="font-display text-2xl font-semibold tracking-tight">Dashboard Keputusan</h1>
				<Badge variant={data.readiness.isReady ? 'success' : 'warning'}>
					{#if data.readiness.isReady}
						<CircleCheck data-icon="inline-start" />
						Siap dihitung
					{:else}
						<OctagonAlert data-icon="inline-start" />
						Perlu dilengkapi
					{/if}
				</Badge>
			</div>
			<p class="text-sm text-muted-foreground">
				Pantau kesiapan data dan hasil perhitungan MOORA terbaru.
			</p>
		</div>
		<Button href="/admin/moora-calculation">
			<Calculator data-icon="inline-start" />
			Hitung MOORA
		</Button>
	</header>

	{#if !data.readiness.isReady}
		<Alert.Root variant="destructive" class="pr-4 sm:pr-18">
			<OctagonAlert />
			<Alert.Title>Data belum siap dihitung</Alert.Title>
			<Alert.Description>
				<ul class="list-inside list-disc">
					{#each data.readiness.issues as issue (issue)}
						<li>{issue}</li>
					{/each}
				</ul>
			</Alert.Description>
			<Alert.Action
				class="static col-start-2 mt-2 justify-self-start sm:absolute sm:top-2.5 sm:right-3 sm:mt-0"
			>
				<Button href="/admin/alternative-values" variant="outline" size="sm">Lengkapi data</Button>
			</Alert.Action>
		</Alert.Root>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<Motorbike class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Alternative Aktif</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.activeAlternativeCount}
				</span>
				<span class="text-xs text-muted-foreground/70">motor dalam decision matrix</span>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div class="flex size-8 items-center justify-center rounded-md bg-info/10 text-info">
						<ListChecks class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Kriteria Aktif</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.activeCriteriaCount}
				</span>
				<span class="text-xs text-muted-foreground/70">faktor penilaian aktif</span>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-success/10 text-success"
					>
						<ClipboardList class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Kelengkapan Matrix</span>
				</div>
				<div class="flex items-end justify-between gap-3">
					<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
						{data.summary.completionPercentage}%
					</span>
					<span class="text-xs text-muted-foreground tabular-nums">
						{data.summary.filledCellCount}/{data.summary.totalCellCount}
					</span>
				</div>
				<Progress value={data.summary.filledCellCount} max={data.summary.totalCellCount || 1} />
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-warning/10 text-warning"
					>
						<History class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Total Perhitungan</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.totalRunCount}
				</span>
				<span class="text-xs text-muted-foreground/70">
					{data.latestRun
						? `terakhir ${dateFormatter.format(data.latestRun.run.createdAt)} WIB`
						: 'belum ada run tersimpan'}
				</span>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
		<Card.Root class="min-w-0">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ChartNoAxesColumnIncreasing />
					Peringkat MOORA Terbaru
				</Card.Title>
				<Card.Description>Optimization score dari snapshot perhitungan terakhir.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.latestRun && chartData.length > 0}
					<Chart.Container config={chartConfig} class="aspect-auto h-72 w-full">
						<BarChart
							data={chartData}
							orientation="horizontal"
							bandPadding={0.25}
							y="code"
							xDomain={chartDomain}
							series={[
								{
									key: 'score',
									label: chartConfig.score.label,
									color: chartConfig.score.color
								}
							]}
							axis="y"
							grid={{ x: true }}
							rule={false}
							padding={{ left: 8, right: 16 }}
							props={{
								bars: { stroke: 'none', rounded: 'all', radius: 6 },
								highlight: { area: { fill: 'none' } }
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel>
									{#snippet formatter({ value })}
										<div class="flex min-w-36 items-center justify-between gap-4">
											<span class="text-muted-foreground">Skor optimasi</span>
											<span class="font-mono font-medium tabular-nums">
												{scoreFormatter.format(Number(value))}
											</span>
										</div>
									{/snippet}
								</Chart.Tooltip>
							{/snippet}
						</BarChart>
					</Chart.Container>
					<ol class="sr-only">
						{#each chartData as item (item.alternativeId)}
							<li>
								Peringkat {item.rank}: {item.code}, {item.name}, skor
								{scoreFormatter.format(item.score)}, total benefit
								{scoreFormatter.format(item.totalBenefit)}, total cost
								{scoreFormatter.format(item.totalCost)}.
							</li>
						{/each}
					</ol>
				{:else}
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<ChartNoAxesColumnIncreasing />
							</Empty.Media>
							<Empty.Title>Belum ada hasil perhitungan</Empty.Title>
							<Empty.Description>
								Jalankan MOORA untuk menampilkan peringkat alternative.
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button href="/admin/moora-calculation" size="sm">
								<Calculator data-icon="inline-start" />
								Buat Perhitungan
							</Button>
						</Empty.Content>
					</Empty.Root>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="overflow-hidden">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Trophy class="text-primary" />
					Keputusan Terbaru
				</Card.Title>
				<Card.Description>Alternative dengan optimization score tertinggi.</Card.Description>
			</Card.Header>
			{#if data.latestRun && latestDecision}
				<Card.Content class="flex flex-col gap-5 pt-6">
					<div class="flex flex-col gap-2">
						<Badge variant="secondary" class="w-fit">Peringkat #{latestDecision.rank}</Badge>
						<div>
							<p class="text-sm font-medium text-muted-foreground">{latestDecision.code}</p>
							<h2 class="font-display text-xl leading-tight font-semibold">
								{latestDecision.name}
							</h2>
						</div>
					</div>
					<div class="rounded-lg border bg-muted/40 p-4">
						<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							Optimization score
						</p>
						<p class="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">
							{scoreFormatter.format(latestDecision.score)}
						</p>
						<div class="mt-3 grid grid-cols-2 gap-3 text-xs">
							<div>
								<span class="text-muted-foreground">Benefit</span>
								<p class="font-mono font-medium tabular-nums">
									{scoreFormatter.format(latestDecision.totalBenefit)}
								</p>
							</div>
							<div>
								<span class="text-muted-foreground">Cost</span>
								<p class="font-mono font-medium tabular-nums">
									{scoreFormatter.format(latestDecision.totalCost)}
								</p>
							</div>
						</div>
					</div>
					<div class="flex flex-col gap-1 text-xs text-muted-foreground">
						<time datetime={data.latestRun.run.createdAt.toISOString()}>
							{dateFormatter.format(data.latestRun.run.createdAt)} WIB
						</time>
						<span>
							{data.latestRun.run.alternativeCount} alternative ·
							{data.latestRun.run.criteriaCount} criterion
						</span>
					</div>
				</Card.Content>
				<Card.Footer class="border-t">
					<Button
						href={`/admin/calculation-history/${data.latestRun.run.id}`}
						variant="outline"
						class="w-full"
					>
						Lihat rincian
						<ArrowUpRight data-icon="inline-end" />
					</Button>
				</Card.Footer>
			{:else}
				<Card.Content class="flex flex-1 items-center py-10">
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon"><Trophy /></Empty.Media>
							<Empty.Title>Belum ada keputusan</Empty.Title>
							<Empty.Description>Hasil peringkat pertama akan tampil di sini.</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				</Card.Content>
			{/if}
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<div class="flex flex-col gap-1.5">
				<Card.Title class="flex items-center gap-2">
					<History />
					Perhitungan Terbaru
				</Card.Title>
				<Card.Description>Tiga snapshot terakhir yang tersimpan.</Card.Description>
			</div>
			<Card.Action>
				<Button href="/admin/calculation-history" variant="outline" size="sm">
					Lihat semua
					<ArrowUpRight data-icon="inline-end" />
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content class="px-0">
			{#if data.recentRuns.length > 0}
				<Table.Root>
					<Table.Caption class="sr-only">Tiga perhitungan MOORA terbaru.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head class="min-w-64 ps-6">Perhitungan</Table.Head>
							<Table.Head class="min-w-40">Pembuat</Table.Head>
							<Table.Head class="min-w-44">Cakupan</Table.Head>
							<Table.Head class="w-20 pe-6 text-right">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.recentRuns as run (run.id)}
							<Table.Row>
								<Table.Cell class="ps-6">
									<div class="flex flex-col gap-1">
										<span class="font-medium">{run.name}</span>
										<time
											class="text-xs text-muted-foreground"
											datetime={run.createdAt.toISOString()}
										>
											{dateFormatter.format(run.createdAt)} WIB
										</time>
									</div>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{run.createdByName}</Table.Cell>
								<Table.Cell>
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant="secondary">{run.alternativeCount} alternative</Badge>
										<Badge variant="outline">{run.criteriaCount} criterion</Badge>
									</div>
								</Table.Cell>
								<Table.Cell class="pe-6 text-right">
									<Button
										href={`/admin/calculation-history/${run.id}`}
										variant="ghost"
										size="icon-sm"
										aria-label={`Lihat ${run.name}`}
									>
										<ArrowUpRight />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><History /></Empty.Media>
						<Empty.Title>Belum ada riwayat</Empty.Title>
						<Empty.Description>Calculation run yang disimpan akan tampil di sini.</Empty.Description
						>
					</Empty.Header>
				</Empty.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
