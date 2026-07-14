<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight, Calculator, ChevronLeft, ChevronRight, History } from '@lucide/svelte';

	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import type { PageProps } from './$types.js';

	const dateFormatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	});

	let { data }: PageProps = $props();

	function pageHref(page: number) {
		return `${resolve('/admin/calculation-history')}?page=${page}`;
	}
</script>

<svelte:head>
	<title>Riwayat Perhitungan MOORA</title>
	<meta
		name="description"
		content="Audit daftar dan snapshot hasil perhitungan MOORA yang telah disimpan."
	/>
</svelte:head>

<div class="flex min-w-0 flex-col gap-4">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 flex-col gap-1">
			<h1 class="font-display text-2xl font-semibold tracking-tight">Riwayat Perhitungan</h1>
			<p class="text-sm text-muted-foreground">
				Audit snapshot hasil dan tahapan perhitungan MOORA yang tersimpan.
			</p>
		</div>
		<Button href="/admin/moora-calculation">
			<Calculator data-icon="inline-start" />
			Hitung MOORA
		</Button>
	</header>

	{#if data.runs.length === 0}
		<Empty.Root class="border border-dashed">
			<Empty.Header>
				<Empty.Media variant="icon">
					<History />
				</Empty.Media>
				<Empty.Title>Belum ada riwayat perhitungan</Empty.Title>
				<Empty.Description>
					Jalankan perhitungan MOORA untuk membuat snapshot pertama.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href="/admin/moora-calculation" size="sm">
					<Calculator data-icon="inline-start" />
					Buat Perhitungan
				</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<History />
					Calculation run
				</Card.Title>
				<Card.Description>Urutan terbaru berdasarkan waktu perhitungan.</Card.Description>
			</Card.Header>
			<Card.Content class="px-0">
				<Table.Root>
					<Table.Caption class="sr-only">Daftar riwayat perhitungan MOORA.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head class="min-w-72 ps-6">Perhitungan</Table.Head>
							<Table.Head class="min-w-44">Pembuat</Table.Head>
							<Table.Head class="min-w-44">Cakupan</Table.Head>
							<Table.Head class="w-24 pe-6 text-right">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.runs as run (run.id)}
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
										<Badge variant="secondary">{run.alternativeCount} alternatif</Badge>
										<Badge variant="outline">{run.criteriaCount} kriteria</Badge>
									</div>
								</Table.Cell>
								<Table.Cell class="pe-6 text-right">
									<Button href={`/admin/calculation-history/${run.id}`} variant="ghost" size="sm">
										<span class="hidden sm:inline">Lihat</span>
										<ArrowUpRight data-icon="inline-end" />
										<span class="sr-only sm:hidden">Lihat {run.name}</span>
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
			<Card.Footer class="flex-col justify-between gap-3 border-t sm:flex-row">
				<p class="text-xs text-muted-foreground">
					Menampilkan {(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(
						data.pagination.page * data.pagination.pageSize,
						data.pagination.totalItems
					)} dari {data.pagination.totalItems} run
				</p>
				<Pagination.Root
					count={data.pagination.totalItems}
					perPage={data.pagination.pageSize}
					page={data.pagination.page}
					class="mx-0 w-auto"
				>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Button
									href={currentPage > 1 ? pageHref(currentPage - 1) : undefined}
									variant="ghost"
									disabled={currentPage === 1}
									aria-label="Halaman sebelumnya"
								>
									<ChevronLeft data-icon="inline-start" />
									<span class="hidden sm:inline">Sebelumnya</span>
								</Button>
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Button
											href={pageHref(page.value)}
											variant={currentPage === page.value ? 'outline' : 'ghost'}
											size="icon"
											aria-label={`Halaman ${page.value}`}
											aria-current={currentPage === page.value ? 'page' : undefined}
										>
											{page.value}
										</Button>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Button
									href={currentPage < data.pagination.totalPages
										? pageHref(currentPage + 1)
										: undefined}
									variant="ghost"
									disabled={currentPage === data.pagination.totalPages}
									aria-label="Halaman berikutnya"
								>
									<span class="hidden sm:inline">Berikutnya</span>
									<ChevronRight data-icon="inline-end" />
								</Button>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Footer>
		</Card.Root>
	{/if}
</div>
