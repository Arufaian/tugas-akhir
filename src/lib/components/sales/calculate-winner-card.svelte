<script lang="ts">
	import yamahaLogo from '$lib/assets/favicon1.png';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Item from '$lib/components/ui/item/index.js';

	import {
		formatCriterionValue,
		formatCurrency,
		percentFormatter,
		type RankedAlternative,
		scoreFormatter
	} from './types.js';

	interface Props {
		winner: RankedAlternative;
		runnerUp: RankedAlternative | undefined;
		totalRanked: number;
		scoreGap: number | null;
	}

	let { winner, runnerUp, totalRanked, scoreGap }: Props = $props();
</script>

<Card.Root class="relative isolate min-h-96">
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -top-6 left-4 text-[8rem] leading-none font-black tracking-tighter text-primary/10 sm:text-[11rem]"
	>
		01
	</span>
	<Card.Header class="relative">
		<Card.Action><Badge variant="success">Rekomendasi utama</Badge></Card.Action>
		<Card.Title class="max-w-xl text-2xl sm:text-3xl">{winner.name}</Card.Title>
		<Card.Description>
			{winner.code} · {winner.category} · {formatCurrency(winner.price)}
		</Card.Description>
	</Card.Header>
	<Card.Content class="relative grid flex-1 items-center gap-8 lg:grid-cols-2">
		<div class="flex flex-col gap-5">
			<div>
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Skor optimasi
				</p>
				<p class="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums">
					{scoreFormatter.format(winner.optimizationScore)}
				</p>
			</div>
			<dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div class="col-span-2 rounded-lg bg-muted/50 p-3 sm:col-span-1">
					<dt class="text-xs text-muted-foreground">Peringkat</dt>
					<dd class="mt-1 font-mono font-semibold tabular-nums">
						#{winner.rank} dari {totalRanked}
					</dd>
				</div>
				<div class="rounded-lg bg-muted/50 p-3">
					<dt class="text-xs text-muted-foreground">Benefit</dt>
					<dd class="mt-1 font-mono font-semibold tabular-nums">
						{scoreFormatter.format(winner.totalBenefit)}
					</dd>
				</div>
				<div class="rounded-lg bg-muted/50 p-3">
					<dt class="text-xs text-muted-foreground">Cost</dt>
					<dd class="mt-1 font-mono font-semibold tabular-nums">
						{scoreFormatter.format(winner.totalCost)}
					</dd>
				</div>
			</dl>
			<p class="max-w-md leading-6 text-muted-foreground">
				Skor optimasi diperoleh dari total benefit dikurangi total cost pada seluruh kriteria
				aktif.
			</p>
			{#if runnerUp && scoreGap !== null}
				<Item.Root variant="outline">
					<Item.Content>
						<Item.Description>
							Pembanding terdekat · peringkat #{runnerUp.rank}
						</Item.Description>
						<Item.Title>{runnerUp.name}</Item.Title>
					</Item.Content>
					<Item.Actions class="ms-auto flex-col items-end">
						<span class="font-mono text-sm font-semibold tabular-nums">
							{scoreFormatter.format(runnerUp.optimizationScore)}
						</span>
						<span class="text-xs text-muted-foreground">
							Selisih {scoreFormatter.format(scoreGap)}
						</span>
					</Item.Actions>
				</Item.Root>
			{/if}
		</div>
		<div class="aspect-4/3 rounded-xl bg-muted/40 p-6 sm:p-8">
			<img
				src={winner.imageUrl ?? yamahaLogo}
				alt={`Yamaha ${winner.name}`}
				class="h-full w-full object-contain"
			/>
		</div>
	</Card.Content>
	{#if winner.criteria.length}
		<Card.Footer class="relative flex-col items-stretch gap-4 border-t">
			<div class="flex flex-col gap-1">
				<h3 class="font-display text-lg font-semibold">Dasar penilaian</h3>
				<p class="text-sm text-muted-foreground">
					Nilai motor pada setiap kriteria beserta jenis dan bobotnya.
				</p>
			</div>
			<dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each winner.criteria as criterion (criterion.criterionId)}
					<div class="flex min-w-0 flex-col gap-2 rounded-lg border p-4">
						<dt class="text-sm text-muted-foreground">{criterion.name}</dt>
						<dd class="flex flex-1 flex-col gap-2">
							<span class="font-medium wrap-break-word">
								{formatCriterionValue(criterion)}
							</span>
							<span class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<Badge variant={criterion.type === 'benefit' ? 'success' : 'destructive'}>
									{criterion.type === 'benefit' ? 'Benefit' : 'Cost'}
								</Badge>
								Bobot {percentFormatter.format(criterion.weight)}
							</span>
						</dd>
					</div>
				{/each}
			</dl>
		</Card.Footer>
	{/if}
</Card.Root>
