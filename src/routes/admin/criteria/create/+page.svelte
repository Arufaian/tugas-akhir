<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BackLinkButton from '$lib/components/back-link-button.svelte';
	import {
		createCriterionSchema,
		type CreateCriterionSchema
	} from '$lib/validations/criterion.schema.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let { data }: { data: { form: SuperValidated<Infer<CreateCriterionSchema>> } } = $props();

	const initialForm = () => data.form;
	const form = superForm(initialForm(), {
		validators: zod4Client(createCriterionSchema),
		onUpdated({ form: f }) {
			if (f.message?.type === 'success') {
				toast.success(f.message.text);
				setTimeout(() => goto(resolve('/admin/criteria')), 1500);
			} else if (f.message?.type === 'error') {
				toast.error(f.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	const types = [
		{ value: 'benefit', label: 'Benefit', desc: 'Semakin besar semakin baik' },
		{ value: 'cost', label: 'Cost', desc: 'Semakin kecil semakin baik' }
	];

	const inputTypes = [
		{ value: 'number', label: 'Angka', desc: 'Input nilai numerik langsung' },
		{ value: 'scale', label: 'Skala', desc: 'Pilih dari opsi skala' },
		{ value: 'tech_features', label: 'Fitur Teknologi', desc: 'Checklist fitur' }
	];

	const weightOptions = [
		{ value: '1', label: 'Sangat Rendah' },
		{ value: '2', label: 'Rendah' },
		{ value: '3', label: 'Sedang' },
		{ value: '4', label: 'Tinggi' },
		{ value: '5', label: 'Sangat Tinggi' }
	];
</script>

<svelte:head>
	<title>Tambah Kriteria</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLinkButton href="/admin/criteria" label="Kembali ke Kriteria" />

	<Card.Root>
		<Card.Header>
			<Card.Title class="font-display text-2xl font-semibold tracking-tight"
				>Tambah Kriteria</Card.Title
			>
			<Card.Description class="text-sm text-muted-foreground">
				Tentukan kriteria baru untuk penilaian motor
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form method="POST" use:enhance class="flex flex-col gap-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Nama Kriteria</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Cth: Harga Motor" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="unit">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Satuan</Form.Label>
								<Input {...props} bind:value={$formData.unit} placeholder="Cth: CC, kg, tahun" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field {form} name="type">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Tipe Kriteria</Form.Label>
							<RadioGroup.Root bind:value={$formData.type} {...props}>
								{#each types as t (t.value)}
									<div class="flex items-center gap-2">
										<RadioGroup.Item value={t.value} id={`type-${t.value}`} />
										<Label for={`type-${t.value}`}>{t.label}</Label>
									</div>
								{/each}
							</RadioGroup.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="inputType">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Tipe Input</Form.Label>
							<RadioGroup.Root bind:value={$formData.inputType} {...props}>
								{#each inputTypes as t (t.value)}
									<div class="flex items-center gap-2">
										<RadioGroup.Item value={t.value} id={`input-type-${t.value}`} />
										<Label for={`input-type-${t.value}`}>{t.label}</Label>
									</div>
								{/each}
							</RadioGroup.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="rawWeight">
					<Form.Control>
						{#snippet children({ props })}
							<Field.Set>
								<Field.Label>Bobot Skala</Field.Label>
								<Field.Description>Pilih tingkat kepentingan kriteria</Field.Description>
								<RadioGroup.Root bind:value={$formData.rawWeight} {...props}>
									{#each weightOptions as w (w.value)}
										<Field.Field orientation="horizontal">
											<RadioGroup.Item value={w.value} id={`weight-${w.value}`} />
											<Field.Label for={`weight-${w.value}`} class="font-normal"
												>{w.value} - {w.label}</Field.Label
											>
										</Field.Field>
									{/each}
								</RadioGroup.Root>
							</Field.Set>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Deskripsi</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.description}
								placeholder="Penjelasan singkat tentang kriteria ini"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="flex justify-end gap-2">
					<Button href={resolve('/admin/criteria')} variant="outline">Batal</Button>
					<Form.Button disabled={$submitting}>
						{#if $submitting}
							<Spinner />
							Menyimpan...
						{:else}
							Simpan
						{/if}
					</Form.Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
