<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';

	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import {
		OctagonAlert,
		ClipboardList,
		ListChecks,
		Motorbike,
		CircleCheck,
		Ellipsis,
		PencilLine,
		RotateCcw
	} from '@lucide/svelte';

	import type { PageData } from './$types.js';

	type Alternative = PageData['completeness']['alternatives'][number];

	let { data }: { data: PageData } = $props();
	let selectedAlternative = $state<Alternative | null>(null);
	let clearDialogOpen = $state(false);
	let isClearing = $state(false);

	function openClearDialog(alternative: Alternative) {
		selectedAlternative = alternative;
		clearDialogOpen = true;
	}

	const readinessIssues = $derived([
		...(data.summary.activeAlternativeCount === 0
			? ['Belum ada alternatif aktif untuk dinilai.']
			: []),
		...(data.summary.activeCriteriaCount === 0 ? ['Belum ada kriteria aktif untuk matriks.'] : []),
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
				<span class="text-xs text-muted-foreground/70">kriteria untuk dinilai</span>
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
					Butuh minimal satu alternatif aktif dan satu kriteria aktif.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Progress Nilai Alternatif</Card.Title>
				<Card.Description>
					Lengkapi semua kriteria aktif sebelum menjalankan perhitungan MOORA.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Item.Group class="gap-0 rounded-xl border bg-card p-1">
					{#each data.completeness.alternatives as alternative, index (alternative.id)}
						<Item.Root size="sm">
							<Item.Content class="min-w-0 gap-2">
								<Item.Title class="flex w-full flex-wrap items-center gap-2">
									<div class="items-centar flex justify-center gap-2">
										<Badge>
											{alternative.code}
										</Badge>
										<span class="min-w-0 truncate font-semibold">{alternative.name}</span>
									</div>

									<Separator
										orientation="vertical"
										class=" hidden data-[orientation=vertical]:h-4 sm:block"
									/>

									{#if alternative.isComplete}
										<Badge variant="success">Lengkap</Badge>
									{:else}
										<div class="item-center flex justify-center gap-2">
											{#each alternative.missingCriteria as criterion (criterion.id)}
												<Badge
													variant="destructive"
													title={criterion.reason === 'invalid_scale'
														? 'Skala tidak valid'
														: undefined}
												>
													{criterion.code}
												</Badge>
											{/each}
										</div>
									{/if}
								</Item.Title>

								<Item.Footer class="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
									<div class="flex items-center justify-between text-sm sm:w-40">
										<span class="text-muted-foreground">Kriteria terisi</span>
										<span class="shrink-0 font-medium tabular-nums">
											{alternative.filledCount} / {data.criteria.length}
										</span>
									</div>
									<div class="flex min-w-0 flex-1 items-center gap-2">
										<Progress
											class="min-w-0 flex-1"
											value={alternative.filledCount}
											max={data.criteria.length}
										/>
										<Item.Actions>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													{#snippet child({ props })}
														<Button
															{...props}
															variant="ghost"
															size="icon-sm"
															aria-label={`Aksi untuk ${alternative.name}`}
														>
															<Ellipsis />
														</Button>
													{/snippet}
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end" class="w-40">
													<DropdownMenu.Group>
														<DropdownMenu.Item
															onclick={() =>
																goto(resolve(`/admin/alternatives/${alternative.id}/values`))}
														>
															<PencilLine />
															Nilai
														</DropdownMenu.Item>
													</DropdownMenu.Group>
													<DropdownMenu.Separator />
													<DropdownMenu.Group>
														<DropdownMenu.Item
															variant="destructive"
															disabled={alternative.filledCount === 0}
															onclick={() => openClearDialog(alternative)}
														>
															<RotateCcw />
															Clear nilai
														</DropdownMenu.Item>
													</DropdownMenu.Group>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</Item.Actions>
									</div>
								</Item.Footer>
							</Item.Content>
						</Item.Root>
						{#if index < data.completeness.alternatives.length - 1}
							<Item.Separator class="my-0" />
						{/if}
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<AlertDialog.Root bind:open={clearDialogOpen}>
	<AlertDialog.Content>
		<form
			method="POST"
			action="?/clear"
			use:enhance={() => {
				isClearing = true;

				return async ({ result }) => {
					try {
						if (result.type === 'success') {
							toast.success((result.data as { message: string }).message);
							clearDialogOpen = false;
							selectedAlternative = null;
							await invalidateAll();
						} else if (result.type === 'failure') {
							toast.error(
								(result.data as { message?: string }).message ??
									'Gagal membersihkan nilai alternatif'
							);
						} else {
							toast.error('Gagal membersihkan nilai alternatif');
						}
					} finally {
						isClearing = false;
					}
				};
			}}
		>
			<AlertDialog.Header>
				<AlertDialog.Title>Bersihkan nilai {selectedAlternative?.code}?</AlertDialog.Title>
				<AlertDialog.Description>
					Semua nilai {selectedAlternative?.name}, termasuk nilai pada kriteria yang sedang
					nonaktif, akan dihapus. Tindakan ini tidak dapat dibatalkan.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer class="pt-4">
				<AlertDialog.Cancel type="button" disabled={isClearing}>Batal</AlertDialog.Cancel>
				<input type="hidden" name="alternativeId" value={selectedAlternative?.id ?? ''} />
				<Button type="submit" variant="destructive" disabled={isClearing || !selectedAlternative}>
					{#if isClearing}
						<Spinner data-icon="inline-start" />
						Membersihkan...
					{:else}
						Clear nilai
					{/if}
				</Button>
			</AlertDialog.Footer>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>
