<script lang="ts">
	import { Archive, CalendarClock, ListChecks, UserRound } from '@lucide/svelte';

	import BackLinkButton from '$lib/components/back-link-button.svelte';
	import MooraRunSnapshot from '$lib/components/moora-run-snapshot.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import type { PageProps } from './$types.js';

	const dateFormatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	});

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.run.name} | Riwayat MOORA</title>
	<meta name="description" content={`Audit snapshot ${data.run.name}.`} />
</svelte:head>

<div class="flex min-w-0 flex-col gap-4">
	<BackLinkButton href="/admin/calculation-history" label="Kembali ke riwayat" />

	<header class="flex min-w-0 flex-col gap-1">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="font-display text-2xl font-semibold tracking-tight">{data.run.name}</h1>
			<Badge variant="secondary">
				<Archive data-icon="inline-start" />
				Snapshot tersimpan
			</Badge>
		</div>
		<p class="text-sm text-muted-foreground">
			Hasil ini menggunakan nama, label, dan nilai yang tersimpan saat perhitungan dijalankan.
		</p>
	</header>

	<Card.Root size="sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<CalendarClock />
				Metadata perhitungan
			</Card.Title>
			<Card.Description>
				Dibuat {dateFormatter.format(data.run.createdAt)} WIB
			</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-4 sm:grid-cols-3">
			<div class="flex items-center gap-3">
				<UserRound class="text-muted-foreground" />
				<div class="flex flex-col">
					<span class="text-xs text-muted-foreground">Pembuat</span>
					<span class="text-sm font-medium">{data.run.createdByName}</span>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<ListChecks class="text-muted-foreground" />
				<div class="flex flex-col">
					<span class="text-xs text-muted-foreground">Alternatif</span>
					<span class="text-sm font-medium">{data.run.alternativeCount} data</span>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<ListChecks class="text-muted-foreground" />
				<div class="flex flex-col">
					<span class="text-xs text-muted-foreground">Kriteria</span>
					<span class="text-sm font-medium">{data.run.criteriaCount} data</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<MooraRunSnapshot
		criteria={data.criteria}
		alternatives={data.alternatives}
		matrixRows={data.matrixRows}
		results={data.results}
	/>
</div>
