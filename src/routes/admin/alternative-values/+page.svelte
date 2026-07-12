<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { OctagonAlert, ClipboardList, ListChecks, Motorbike, CircleCheck } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const readinessIssues = $derived([
		...(data.summary.activeAlternativeCount === 0
			? ['Belum ada alternatif aktif untuk dinilai.']
			: []),
		...(data.summary.activeCriteriaCount === 0 ? ['Belum ada kriteria aktif untuk matrix.'] : []),
		...(data.needsNormalization
			? [`Total bobot normal aktif ${(data.normalizedSum * 100).toFixed(2)}%, belum 100%.`]
			: []),
		...(data.emptyScaleCriteria.length > 0
			? [`${data.emptyScaleCriteria.length} kriteria skala belum punya opsi.`]
			: [])
	]);
</script>

<svelte:head>
	<title>Nilai Alternatif</title>
</svelte:head>

<div class="flex min-w-0 flex-col gap-4">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="font-display text-2xl font-semibold tracking-tight">Nilai Alternatif</h1>
			<p class="text-sm text-muted-foreground">
				Pantau kelengkapan nilai setiap alternatif sebelum perhitungan MOORA.
			</p>
		</div>
		<Badge variant={readinessIssues.length > 0 ? 'warning' : 'success'}>
			{readinessIssues.length > 0 ? 'Perlu dicek' : 'Siap diisi'}
		</Badge>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<Motorbike class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Alternatif Aktif</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.activeAlternativeCount}
				</span>
				<span class="text-xs text-muted-foreground/70">motor siap dinilai</span>
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
				<span class="text-xs text-muted-foreground/70">criteria untuk dinilai</span>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-success/10 text-success"
					>
						<CircleCheck class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Terisi</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.filledCellCount}
				</span>
				<span class="text-xs text-muted-foreground/70">
					dari {data.summary.totalCellCount} penilaian
				</span>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-warning/10 text-warning"
					>
						<ClipboardList class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Kosong</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.emptyCellCount}
				</span>
				<span class="text-xs text-muted-foreground/70">masih perlu dilengkapi</span>
			</Card.Content>
		</Card.Root>
	</div>

	{#if readinessIssues.length > 0}
		<Alert.Root variant="destructive">
			<OctagonAlert />
			<Alert.Title>Data belum sepenuhnya siap</Alert.Title>
			<Alert.Description class="flex flex-wrap items-center gap-x-1">
				<span>{readinessIssues.join(' ')}</span>
				{#each data.emptyScaleCriteria as criterion (criterion.id)}
					<a href={resolve(`/admin/criteria/${criterion.id}/scales`)}>
						Atur {criterion.code}
					</a>
				{/each}
				{#if data.summary.activeAlternativeCount === 0}
					<a href={resolve('/admin/alternatives')}>Kelola Alternatif</a>
				{/if}
				{#if data.summary.activeCriteriaCount === 0 || data.needsNormalization}
					<a href={resolve('/admin/criteria')}>Kelola Kriteria</a>
				{/if}
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if data.summary.activeAlternativeCount === 0 || data.summary.activeCriteriaCount === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<ClipboardList />
				</Empty.Media>
				<Empty.Title>Belum ada nilai yang dapat dipantau</Empty.Title>
				<Empty.Description>
					Butuh minimal satu alternatif aktif dan satu criteria aktif.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Progress Nilai Alternatif</Card.Title>
				<Card.Description>
					Lengkapi semua criteria aktif sebelum menjalankan perhitungan MOORA.
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#each data.completeness.alternatives as alternative (alternative.id)}
					<Card.Root size="sm" class="mb-4 last:mb-0">
						<Card.Header class="gap-1">
							<Card.Title class="text-base">{alternative.code}</Card.Title>
							<Card.Description>{alternative.name}</Card.Description>
							<Card.Action>
								<Badge variant={alternative.isComplete ? 'success' : 'warning'}>
									{alternative.isComplete ? 'Lengkap' : 'Belum lengkap'}
								</Badge>
							</Card.Action>
						</Card.Header>
						<Card.Content class="flex flex-col gap-2">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Criteria terisi</span>
								<span class="font-medium tabular-nums">
									{alternative.filledCount} / {data.criteria.length}
								</span>
							</div>
							<Progress value={alternative.filledCount} max={data.criteria.length} />
							{#if alternative.missingCriteria.length > 0}
								<p class="text-xs text-muted-foreground">
									Belum:
									{alternative.missingCriteria
										.map((criterion) =>
											criterion.reason === 'invalid_scale'
												? `${criterion.code} (skala tidak valid)`
												: criterion.code
										)
										.join(', ')}
								</p>
							{/if}
						</Card.Content>
						<Card.Footer class="justify-end">
							<Button
								href={`/admin/alternatives/${alternative.id}/values`}
								variant="outline"
								size="sm"
							>
								{alternative.filledCount > 0 ? 'Edit Nilai' : 'Isi Nilai'}
							</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
