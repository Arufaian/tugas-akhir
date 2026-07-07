<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	type Scale = PageData['scales'][number];
	type ScaleForm = SuperForm<{
		label: string;
		value: number;
		description?: string | undefined;
	}>;

	let {
		open = $bindable(false),
		criterionName,
		editingScale,
		form,
		onClose
	}: {
		open: boolean;
		criterionName: string;
		editingScale: Scale | null;
		form: ScaleForm;
		onClose: () => void;
	} = $props();

	const initialForm = () => form;
	const { form: formData, enhance, submitting } = initialForm();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<form method="POST" action={editingScale ? '?/update' : '?/create'} use:enhance class="contents">
			{#if editingScale}
				<input type="hidden" name="scaleId" value={editingScale.id} />
			{/if}

			<Dialog.Header>
				<Dialog.Title>{editingScale ? 'Edit Skala' : 'Tambah Skala'}</Dialog.Title>
				<Dialog.Description>
					Untuk: {criterionName}
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4">
				<Form.Field {form} name="label">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Label Skala</Form.Label>
							<Input {...props} bind:value={$formData.label} placeholder="Mis: Sangat Terjangkau" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="value">
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

				<Form.Field {form} name="description">
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
				<Button variant="outline" onclick={onClose} type="button">Batal</Button>
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
