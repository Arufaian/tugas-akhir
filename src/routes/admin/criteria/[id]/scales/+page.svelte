<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Ruler, ArrowLeft, Plus, Pencil, Trash2 } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
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
			<div class="flex flex-wrap items-start justify-between gap-2 sm:items-center">
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
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="shrink-0">
						{scales.length} skala
					</Badge>
					<Button size="sm" class="gap-1.5" onclick={openCreateDialog} type="button">
						<Plus class="size-4" />
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
				Belum ada skala. Klik "Tambah" untuk membuat skala pertama.
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

						<div class="flex w-full items-center justify-between gap-2 pt-2">
							{#if scale.description}
								<span class="truncate text-xs text-muted-foreground">{scale.description}</span>
							{/if}

							<div class="align-center flex justify-center gap-2">
								<Button variant="warning" onclick={() => openEditDialog(scale)}>
									<Pencil />
									<span class="hidden text-sm sm:inline">Edit</span>
								</Button>

								<Button variant="destructive" type="button" onclick={() => openDeleteDialog(scale)}>
									<Trash2 />
									<span class="hidden text-sm sm:inline">Hapus</span>
								</Button>
							</div>
						</div>
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
