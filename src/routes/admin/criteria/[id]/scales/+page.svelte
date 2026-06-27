<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Ruler, ArrowLeft, Plus } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { createCriterionScaleSchema } from '$lib/validations/criterion-scale.schema.js';

	let { data } = $props();

	let scales = $derived(data.scales ?? []);
	let criterion = $derived(data.criterion);
	let maxValue = $derived(scales.length > 0 ? Math.max(...scales.map((s) => Number(s.value))) : 1);

	let dialogOpen = $state(false);

	const initialForm = () => data.form;
	const f = superForm(initialForm(), {
		validators: zod4Client(createCriterionScaleSchema),
		onUpdated({ form: f }) {
			if (f.message?.type === 'success') {
				toast.success(f.message.text);
				dialogOpen = false;
			} else if (f.message?.type === 'error') {
				toast.error(f.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting, reset } = f;

	$effect(() => {
		if (dialogOpen) {
			reset();
		}
	});
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
					<Button size="sm" class="gap-1.5" onclick={() => (dialogOpen = true)} type="button">
						<Plus class="size-4" />
						<span class="hidden sm:inline">Tambah</span>
					</Button>
				</div>
			</div>
		</Card.Header>
	</Card.Root>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content>
			<form method="POST" action="?/create" use:enhance class="contents">
				<Dialog.Header>
					<Dialog.Title>Tambah Skala</Dialog.Title>
					<Dialog.Description>
						Untuk: {criterion?.name ?? '...'}
					</Dialog.Description>
				</Dialog.Header>

				<div class="grid gap-4">
					<Form.Field form={f} name="label">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Label Skala</Form.Label>
								<Input
									{...props}
									bind:value={$formData.label}
									placeholder="Mis: Sangat Terjangkau"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={f} name="value">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Nilai</Form.Label>
								<div class="flex items-center gap-4 pt-1">
									<Slider
										type="single"
										bind:value={$formData.value}
										min={0}
										max={5}
										step={1}
										class="flex-1"
									/>
									<Badge variant="default" class="w-8 shrink-0 justify-center tabular-nums">
										{$formData.value}
									</Badge>
									<input type="hidden" {...props} value={$formData.value} />
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={f} name="description">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Deskripsi <span class="font-normal text-muted-foreground">(opsional)</span>
								</Form.Label>
								<Textarea
									{...props}
									bind:value={$formData.description}
									placeholder="Penjelasan singkat tentang skala ini"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Dialog.Footer>
					<Button variant="outline" onclick={() => (dialogOpen = false)} type="button">
						Batal
					</Button>
					<Form.Button disabled={$submitting}>
						{#if $submitting}
							<Spinner />
							Menyimpan...
						{:else}
							Simpan
						{/if}
					</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

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
