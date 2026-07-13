<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import BackLinkButton from '$lib/components/back-link-button.svelte';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PowerIcon from '@lucide/svelte/icons/power';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { flushSync } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import {
		createCriterionScaleSchema,
		deleteCriterionScaleSchema
	} from '$lib/validations/criterion-scale.schema.js';
	import ScaleDeleteDialog from './scale-delete-dialog.svelte';
	import ScaleFormDialog from './scale-form-dialog.svelte';
	import type { PageData } from './$types';

	let { data } = $props();

	let scales = $derived(data.scales ?? []);
	let criterion = $derived(data.criterion);
	let maxValue = $derived(scales.length > 0 ? Math.max(...scales.map((s) => Number(s.value))) : 1);

	type Scale = PageData['scales'][number];

	let dialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let editingScale = $state<Scale | null>(null);
	let deletingScale = $state<Scale | null>(null);
	let pendingStatus = $state<string | null>(null);
	let statusForm: HTMLFormElement;
	let statusScaleId = $state('');
	let statusIsActive = $state(false);

	const initialForm = () => data.form;
	const f = superForm(initialForm(), {
		validators: zod4Client(createCriterionScaleSchema),
		onUpdated({ form: f }) {
			if (f.message?.type === 'success') {
				toast.success(f.message.text);
				closeDialog();
			} else if (f.message?.type === 'error') {
				toast.error(f.message.text);
			}
		}
	});

	const { form: formData, reset } = f;

	const initialDeleteForm = () => data.deleteForm;
	const deleteF = superForm(initialDeleteForm(), {
		validators: zod4Client(deleteCriterionScaleSchema),
		onUpdated({ form: f }) {
			if (f.message?.type === 'success') {
				toast.success(f.message.text);
				closeDeleteDialog();
			} else if (f.message?.type === 'error') {
				toast.error(f.message.text);
			}
		}
	});
	const { form: deleteFormData } = deleteF;

	function openCreateDialog() {
		editingScale = null;
		reset();
		dialogOpen = true;
	}

	function openEditDialog(scale: Scale) {
		editingScale = scale;
		$formData.label = scale.label;
		$formData.value = Number(scale.value);
		$formData.description = scale.description ?? '';
		dialogOpen = true;
	}

	function closeDialog() {
		dialogOpen = false;
		editingScale = null;
	}

	function openDeleteDialog(scale: Scale) {
		deletingScale = scale;
		$deleteFormData.scaleId = scale.id;
		deleteDialogOpen = true;
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
		deletingScale = null;
	}

	function updateStatus(scale: Scale) {
		if (pendingStatus) return;

		flushSync(() => {
			pendingStatus = scale.id;
			statusScaleId = scale.id;
			statusIsActive = !scale.isActive;
		});
		statusForm.requestSubmit();
	}
</script>

<svelte:head>
	<title>Skala Penilaian — {criterion?.name ?? '...'}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLinkButton href="/admin/criteria" label="Kembali ke Kriteria" />

	<Card.Root>
		<Card.Header>
			<div class="flex flex-wrap items-start justify-between gap-2 sm:items-center">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-15 items-center justify-center rounded-lg bg-primary/10 text-primary md:w-10"
					>
						<RulerIcon class="size-4 md:size-6" />
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
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="shrink-0">
						{scales.length} skala
					</Badge>
					<Button size="sm" class="gap-1.5" onclick={openCreateDialog} type="button">
						<PlusIcon data-icon="inline-start" />
						<span class="hidden sm:inline">Tambah</span>
					</Button>
				</div>
			</div>
		</Card.Header>
	</Card.Root>

	<ScaleFormDialog
		bind:open={dialogOpen}
		criterionName={criterion?.name ?? '...'}
		{editingScale}
		form={f}
		onClose={closeDialog}
	/>

	<ScaleDeleteDialog
		bind:open={deleteDialogOpen}
		scale={deletingScale}
		form={deleteF}
		onClose={closeDeleteDialog}
	/>

	<form
		bind:this={statusForm}
		method="POST"
		action="?/status"
		class="hidden"
		use:enhance={() => {
			return async ({ result }) => {
				try {
					if (result.type === 'success') {
						const { isActive } = result.data as { isActive: boolean };
						toast.success(isActive ? 'Skala berhasil diaktifkan' : 'Skala berhasil dinonaktifkan');
						await invalidateAll();
					} else if (result.type === 'failure') {
						toast.error(
							(result.data as { message?: string } | undefined)?.message ??
								'Gagal mengubah status skala'
						);
					} else {
						toast.error('Gagal mengubah status skala');
					}
				} finally {
					pendingStatus = null;
				}
			};
		}}
	>
		<input type="hidden" name="scaleId" value={statusScaleId} />
		<input type="hidden" name="isActive" value={String(statusIsActive)} />
	</form>

	{#if scales.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<RulerIcon class="size-4 md:size-6" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">
				Belum ada skala. Klik "Tambah" untuk membuat skala pertama.
			</p>
		</div>
	{:else}
		<Item.Group class="gap-0 rounded-xl border bg-card p-1">
			{#each scales as scale, i (scale.id)}
				<Item.Root>
					<Item.Media>
						<Badge variant="secondary" class="text-center font-medium tabular-nums">
							{i + 1}
						</Badge>
					</Item.Media>

					<Item.Content class="min-w-40 gap-2">
						<Item.Title>
							{scale.label}
							<Badge variant={scale.isActive ? 'success' : 'destructive'}>
								{scale.isActive ? 'Aktif' : 'Nonaktif'}
							</Badge>
						</Item.Title>
						{#if scale.description}
							<Item.Description>{scale.description}</Item.Description>
						{/if}
						<Progress value={Number(scale.value)} max={maxValue} />
					</Item.Content>

					<Badge variant="outline" class="shrink-0 tabular-nums">{scale.value}</Badge>

					<Item.Actions>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										size="icon"
										aria-label={`Aksi untuk ${scale.label}`}
									>
										<EllipsisIcon />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-40">
								<DropdownMenu.Group>
									<DropdownMenu.Item onclick={() => openEditDialog(scale)}>
										<PencilIcon />
										Edit
									</DropdownMenu.Item>
									<DropdownMenu.Item
										disabled={pendingStatus !== null}
										onclick={() => updateStatus(scale)}
									>
										<PowerIcon />
										{pendingStatus === scale.id
											? 'Memproses...'
											: scale.isActive
												? 'Nonaktifkan'
												: 'Aktifkan'}
									</DropdownMenu.Item>
								</DropdownMenu.Group>
								<DropdownMenu.Separator />
								<DropdownMenu.Group>
									<DropdownMenu.Item variant="destructive" onclick={() => openDeleteDialog(scale)}>
										<Trash2Icon />
										Hapus
									</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Item.Actions>
				</Item.Root>

				{#if i < scales.length - 1}
					<Item.Separator class="my-0" />
				{/if}
			{/each}
		</Item.Group>
	{/if}
</div>
