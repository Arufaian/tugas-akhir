<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Ruler, ArrowLeft } from '@lucide/svelte';

	let { data } = $props();

	let scales = $derived(data.scales ?? []);
	let criterion = $derived(data.criterion);
	let maxValue = $derived(scales.length > 0 ? Math.max(...scales.map((s) => Number(s.value))) : 1);
</script>

<svelte:head>
	<title>Skala Penilaian — {criterion?.name ?? '...'}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<Button variant="link" href="/admin/criteria" class="w-fit px-0 text-muted-foreground">
		<ArrowLeft class="size-4" />
		Kembali ke Kriteria
	</Button>

	<Card.Root>
		<Card.Header>
			<div class="flex items-start justify-between gap-2 sm:items-center">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-15 items-center justify-center rounded-lg bg-primary/10 text-primary md:w-10"
					>
						<Ruler class="size-4 md:size-6" />
					</div>
					<div>
						<Card.Title class="font-display text-2xl font-semibold tracking-tight">
							Skala Penilaian
						</Card.Title>
						<Card.Description class="text-muted-foreground">
							Atur tingkat penilaian untuk {criterion?.name ?? '...'}
						</Card.Description>
					</div>
				</div>
				<Badge variant="secondary" class="shrink-0">
					{scales.length} skala
				</Badge>
			</div>
		</Card.Header>
	</Card.Root>

	{#if scales.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<Ruler class="size-4 md:size-6" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">
				Belum ada skala. Tambah skala pertama di atas.
			</p>
		</div>
	{:else}
		<div class="rounded-xl border bg-card">
			{#each scales as scale, i (scale.id)}
				<div class="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
					<Badge variant="secondary" class="text-center font-medium tabular-nums">
						{i + 1}
					</Badge>

					<div class="flex flex-1 flex-col gap-1.5">
						<div class="flex flex-wrap items-center gap-x-2">
							<span class="text-sm font-medium">{scale.label}</span>
						</div>
						<Progress value={Number(scale.value)} max={maxValue} />

						{#if scale.description}
							<span class="truncate text-xs text-muted-foreground">{scale.description}</span>
						{/if}
					</div>

					<Badge variant="default" class="shrink-0 tabular-nums">
						{scale.value}
					</Badge>
				</div>

				{#if i < scales.length - 1}
					<Separator />
				{/if}
			{/each}
		</div>
	{/if}
</div>
