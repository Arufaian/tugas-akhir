<script lang="ts">
	import { resolve } from '$app/paths';
	import { AlertTriangle } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	import { technologyFeatures } from '$lib/constants/technology-features.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { alternativeCriterionValuesSchema } from '$lib/validations/alternative-criterion-value.schema.js';

	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const initialForm = () => data.form;
	const form = superForm(initialForm(), {
		dataType: 'json',
		validators: zod4Client(alternativeCriterionValuesSchema),
		multipleSubmits: 'prevent',
		resetForm: false,
		invalidateAll: 'pessimistic',
		onUpdated({ form: updatedForm }) {
			if (updatedForm.message?.type === 'success') toast.success(updatedForm.message.text);
			if (updatedForm.message?.type === 'error') toast.error(updatedForm.message.text);
		}
	});

	const { form: formData, enhance, submitting } = form;

	function selectedScaleLabel(index: number) {
		const criterion = data.criteria[index];
		return (
			criterion.scales.find((scale) => scale.value === $formData.values[index].value)?.label ??
			'Pilih skala'
		);
	}

	function setFeature(index: number, featureId: string, checked: boolean) {
		const selected = $formData.values[index].selectedFeatureIds;
		$formData.values[index].selectedFeatureIds = checked
			? [...new Set([...selected, featureId])]
			: selected.filter((id) => id !== featureId);
	}

	function featureScore(index: number) {
		const selected = new Set($formData.values[index].selectedFeatureIds);
		return technologyFeatures.reduce(
			(total, feature) => total + (selected.has(feature.id) ? feature.score : 0),
			0
		);
	}
</script>

<svelte:head>
	<title>Nilai {data.alternative.code}</title>
</svelte:head>

<div class=" flex min-w-0 flex-col gap-4">
	<Card.Root>
		<form method="POST" use:enhance class="contents">
			<Card.Header>
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="flex flex-col gap-1">
						<Card.Title class="font-display text-2xl font-semibold tracking-tight">
							Nilai {data.alternative.code}
						</Card.Title>
						<Card.Description>{data.alternative.name}</Card.Description>
					</div>
					<Badge variant="secondary">{data.criteria.length} kriteria aktif</Badge>
				</div>
			</Card.Header>

			<Card.Content>
				<Field.Group>
					{#each data.criteria as criterion, index (criterion.id)}
						<Field.Set>
							<Field.Legend class="flex items-center gap-2">
								<Badge variant="outline">{criterion.code}</Badge>
								{criterion.name}
							</Field.Legend>
							<Field.Description>{criterion.description}</Field.Description>

							{#if criterion.inputType === 'number'}
								<Form.Field {form} name={`values[${index}].value`}>
									{#snippet children({ errors })}
										<Field.Field data-invalid={errors.length > 0}>
											<Form.Control>
												{#snippet children({ props })}
													<Form.Label>Nilai {criterion.name}</Form.Label>
													<InputGroup.Root>
														<InputGroup.Input
															{...props}
															type="text"
															inputmode="decimal"
															aria-invalid={errors.length > 0}
															bind:value={$formData.values[index].value}
															placeholder="Masukkan nilai"
														/>
														{#if criterion.unit}
															<InputGroup.Addon align="inline-end">
																<InputGroup.Text>{criterion.unit}</InputGroup.Text>
															</InputGroup.Addon>
														{/if}
													</InputGroup.Root>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Field.Field>
									{/snippet}
								</Form.Field>
							{:else if criterion.inputType === 'scale'}
								{#if criterion.scales.length === 0}
									<Alert.Root class="border-warning/30 bg-warning/10 text-warning">
										<AlertTriangle />
										<Alert.Title>Opsi skala belum tersedia</Alert.Title>
										<Alert.Description class="text-warning/80">
											Atur skala kriteria ini sebelum memberikan nilai.
										</Alert.Description>
									</Alert.Root>
								{:else}
									<Form.Field {form} name={`values[${index}].value`}>
										{#snippet children({ errors })}
											<Field.Field data-invalid={errors.length > 0}>
												<Form.Control>
													{#snippet children({ props: { name, ...triggerProps } })}
														<Form.Label>Nilai {criterion.name}</Form.Label>
														<Select.Root
															type="single"
															{name}
															bind:value={$formData.values[index].value}
														>
															<Select.Trigger
																class="w-full"
																{...triggerProps}
																aria-invalid={errors.length > 0}
															>
																{selectedScaleLabel(index)}
															</Select.Trigger>
															<Select.Content>
																<Select.Group>
																	{#each criterion.scales as scale (scale.value)}
																		<Select.Item value={scale.value} label={scale.label}>
																			{scale.label}
																		</Select.Item>
																	{/each}
																</Select.Group>
															</Select.Content>
														</Select.Root>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Field.Field>
										{/snippet}
									</Form.Field>
								{/if}
							{:else}
								<Form.Field {form} name={`values[${index}].isAssessed`}>
									{#snippet children({ errors })}
										<Form.Control>
											{#snippet children({ props })}
												<Field.Field orientation="horizontal" data-invalid={errors.length > 0}>
													<Field.Content>
														<Form.Label>Penilaian fitur sudah dilakukan</Form.Label>
														<Field.Description>
															Aktifkan juga saat tidak ada fitur agar nilai 0 tercatat.
														</Field.Description>
													</Field.Content>
													<Switch
														{...props}
														aria-invalid={errors.length > 0}
														bind:checked={$formData.values[index].isAssessed}
													/>
												</Field.Field>
											{/snippet}
										</Form.Control>
									{/snippet}
								</Form.Field>

								<Form.Field {form} name={`values[${index}].selectedFeatureIds`}>
									{#snippet children({ errors })}
										<Field.Set data-invalid={errors.length > 0}>
											<Field.Legend variant="label" class="flex items-center gap-2">
												Fitur tersedia
												<Badge variant="secondary">{featureScore(index)} poin</Badge>
											</Field.Legend>
											<Field.Group class="gap-3 sm:grid sm:grid-cols-2">
												{#each technologyFeatures as feature (feature.id)}
													<Form.Control>
														{#snippet children({ props })}
															{@const id = `${props.id}-${feature.id}`}
															<Field.Field orientation="horizontal">
																<Checkbox
																	{...props}
																	{id}
																	value={feature.id}
																	disabled={!$formData.values[index].isAssessed}
																	checked={$formData.values[index].selectedFeatureIds.includes(
																		feature.id
																	)}
																	onCheckedChange={(checked) =>
																		setFeature(index, feature.id, checked)}
																/>
																<Field.Label for={id} class="flex-1 font-normal">
																	<span>{feature.name}</span>
																	<Badge variant="outline">{feature.score}</Badge>
																</Field.Label>
															</Field.Field>
														{/snippet}
													</Form.Control>
												{/each}
											</Field.Group>
											<Form.FieldErrors />
										</Field.Set>
									{/snippet}
								</Form.Field>
							{/if}
						</Field.Set>

						{#if index < data.criteria.length - 1}
							<Field.Separator />
						{/if}
					{/each}
				</Field.Group>
			</Card.Content>

			<Card.Footer class="flex justify-end gap-2 border-t">
				<Button href={resolve('/admin/alternative-values')} variant="outline">Batal</Button>
				<Form.Button disabled={$submitting}>
					{#if $submitting}
						<Spinner aria-label="Menyimpan" />
						Menyimpan...
					{:else}
						Simpan Nilai
					{/if}
				</Form.Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
