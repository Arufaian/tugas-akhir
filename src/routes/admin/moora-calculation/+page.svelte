<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		Calculator,
		CalendarClock,
		CircleCheck,
		ClipboardList,
		History,
		ListChecks,
		OctagonAlert
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import MooraRunSnapshot from '$lib/components/moora-run-snapshot.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	import type { PageProps } from './$types.js';

	const runDateFormatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	});

	let { data }: PageProps = $props();
	let isCalculating = $state(false);

	const handleCalculate: SubmitFunction = () => {
		isCalculating = true;

		return async ({ result, update }) => {
			try {
				await update({ reset: false });

				if (result.type === 'success') {
					toast.success(
						(result.data as { message?: string })?.message ?? 'Perhitungan MOORA berhasil'
					);
				} else if (result.type === 'failure') {
					toast.error(
						(result.data as { message?: string })?.message ?? 'Gagal menjalankan perhitungan MOORA'
					);
				}
			} finally {
				isCalculating = false;
			}
		};
	};
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

		<div class="flex flex-wrap items-center gap-2">
			<Button href="/admin/calculation-history" variant="outline">
				<History data-icon="inline-start" />
				Riwayat
			</Button>
			<form method="POST" action="?/calculate" use:enhance={handleCalculate}>
				<Button type="submit" disabled={!data.readiness.isReady || isCalculating}>
					{#if isCalculating}
						<Spinner data-icon="inline-start" />
						Menghitung...
					{:else}
						<Calculator data-icon="inline-start" />
						Hitung MOORA
					{/if}
				</Button>
			</form>
		</div>
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

	{#if data.run}
		<Card.Root size="sm">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<CalendarClock />
					Run terbaru
				</Card.Title>
				<Card.Description>
					{data.run.name} · {runDateFormatter.format(data.run.createdAt)} WIB
				</Card.Description>
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

		<MooraRunSnapshot
			criteria={data.criteria}
			alternatives={data.alternatives}
			matrixRows={data.matrixRows}
			results={data.results}
		/>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<ClipboardList />
				</Empty.Media>
				<Empty.Title>Belum ada hasil perhitungan</Empty.Title>
				<Empty.Description>
					Lengkapi data lalu jalankan perhitungan MOORA untuk membuat hasil pertama.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}
</div>
