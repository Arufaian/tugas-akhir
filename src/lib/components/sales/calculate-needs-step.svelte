<script lang="ts">
	import { ArrowRight, CircleAlert, RotateCcw } from '@lucide/svelte';
	import type { SuperForm } from 'sveltekit-superforms';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import type { SalesCalculationInput } from '$lib/validations/sales-calculation.schema.js';

	import { formatCurrency } from './types.js';

	interface Props {
		form: SuperForm<SalesCalculationInput>;
		formData: SuperForm<SalesCalculationInput>['form'];
		catalogPriceRange: [number, number] | null;
		categoryOptions: { value: string; label: string }[];
		selectedCategoryLabel: string;
		filteredAlternativesCount: number;
		issues: string[];
		onResetFilters: () => void;
		onShowCandidates: () => void;
		onInvalidateResult: () => void;
	}

	let {
		form,
		formData,
		catalogPriceRange,
		categoryOptions,
		selectedCategoryLabel,
		filteredAlternativesCount,
		issues,
		onResetFilters,
		onShowCandidates,
		onInvalidateResult
	}: Props = $props();
</script>

<Card.Root class="mx-auto w-full max-w-3xl">
	<Card.Header>
		<Card.Title>Kebutuhan pelanggan</Card.Title>
		<Card.Description>
			Tentukan kategori motor dan batas anggaran yang sedang dipertimbangkan.
		</Card.Description>
	</Card.Header>

	<Card.Content>
		{#if issues.length}
			<Alert.Root variant="destructive" class="mb-6">
				<CircleAlert />
				<Alert.Title>Data belum siap digunakan</Alert.Title>
				<Alert.Description>
					<ul class="list-inside list-disc">
						{#each issues as issue (issue)}
							<li>{issue}</li>
						{/each}
					</ul>
				</Alert.Description>
			</Alert.Root>
		{/if}

		<Field.Group>
			<Form.Field {form} name="category">
				{#snippet children({ errors })}
					<Field.Field data-invalid={errors.length > 0}>
						<Form.Control>
							{#snippet children({ props })}
								<Field.Label for={props.id}>Kategori motor</Field.Label>
								<Select.Root
									type="single"
									bind:value={$formData.category}
									onValueChange={onInvalidateResult}
								>
									<Select.Trigger
										id={props.id}
										aria-invalid={errors.length > 0}
										class="w-full"
									>
										{selectedCategoryLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Kategori</Select.Label>
											{#each categoryOptions as option (option.value)}
												<Select.Item value={option.value} label={option.label}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Field.Description>
							Pilih semua kategori jika pelanggan belum menentukan jenis motor.
						</Field.Description>
						<Form.FieldErrors />
					</Field.Field>
				{/snippet}
			</Form.Field>

			{#if catalogPriceRange}
				<Field.Separator />

				<Form.Field {form} name="priceRange">
					{#snippet children({ errors })}
						<Field.Field data-invalid={errors.length > 0}>
							<div class="flex flex-wrap items-start justify-between gap-3">
								<Field.Content>
									<Field.Label id="budget-label">Anggaran pelanggan</Field.Label>
									<Field.Description>
										Geser kedua titik untuk menentukan harga minimum dan maksimum.
									</Field.Description>
								</Field.Content>
								<Badge variant={filteredAlternativesCount >= 2 ? 'success' : 'warning'}>
									{filteredAlternativesCount} motor sesuai
								</Badge>
							</div>

							<div class="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4">
								<div class="flex min-w-0 flex-col gap-1">
									<span class="text-xs text-muted-foreground">Minimum</span>
									<span
										class="truncate font-mono text-base font-semibold tabular-nums sm:text-lg"
									>
										{formatCurrency($formData.priceRange[0])}
									</span>
								</div>
								<div class="flex min-w-0 flex-col gap-1 text-right">
									<span class="text-xs text-muted-foreground">Maksimum</span>
									<span
										class="truncate font-mono text-base font-semibold tabular-nums sm:text-lg"
									>
										{formatCurrency($formData.priceRange[1])}
									</span>
								</div>
							</div>

							<Form.Control>
								{#snippet children({ props })}
									<Slider
										{...props}
										type="multiple"
										bind:value={$formData.priceRange}
										onValueChange={onInvalidateResult}
										min={catalogPriceRange[0]}
										max={catalogPriceRange[1]}
										step={100_000}
										aria-labelledby="budget-label"
										aria-invalid={errors.length > 0}
										class="my-2"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />

							<div class="flex justify-between gap-4 text-xs text-muted-foreground">
								<span>{formatCurrency(catalogPriceRange[0])}</span>
								<span>{formatCurrency(catalogPriceRange[1])}</span>
							</div>
						</Field.Field>
					{/snippet}
				</Form.Field>
			{/if}
		</Field.Group>
	</Card.Content>

	<Card.Footer class="flex-col-reverse gap-2 border-t sm:flex-row sm:justify-between">
		<Button type="button" variant="ghost" class="w-full sm:w-auto" onclick={onResetFilters}>
			<RotateCcw data-icon="inline-start" />
			Reset rentang
		</Button>
		<Button
			type="button"
			class="w-full sm:w-auto"
			disabled={!catalogPriceRange || issues.length > 0}
			onclick={onShowCandidates}
		>
			Tampilkan {filteredAlternativesCount} kandidat
			<ArrowRight data-icon="inline-end" />
		</Button>
	</Card.Footer>
</Card.Root>
