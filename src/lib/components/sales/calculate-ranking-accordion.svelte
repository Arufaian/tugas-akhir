<script lang="ts">
	import yamahaLogo from '$lib/assets/favicon1.png';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import {
		formatCriterionValue,
		formatCurrency,
		percentFormatter,
		type RankedAlternative,
		scoreFormatter
	} from './types.js';

	interface Props {
		rankedAlternatives: RankedAlternative[];
	}

	let { rankedAlternatives }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Peringkat kandidat</Card.Title>
		<Card.Description>Diurutkan dari skor optimasi tertinggi ke terendah.</Card.Description>
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple">
			{#each rankedAlternatives as alternative (alternative.id)}
				<Accordion.Item value={alternative.id}>
					<Accordion.Trigger class="w-full min-w-0 items-center gap-3 hover:no-underline">
						<span class="size-10 shrink-0 overflow-hidden rounded-sm">
							<img src={alternative.imageUrl ?? yamahaLogo} alt="" class="size-full object-cover" />
						</span>
						<span class="flex min-w-0 flex-1 flex-col gap-0.5 text-left overflow-hidden">
							<span class="block w-full truncate font-medium" title={alternative.name}>
								{alternative.name}
							</span>
							<span class="block w-full truncate text-xs font-normal text-muted-foreground">
								{alternative.category} · {formatCurrency(alternative.price)}
							</span>
						</span>
						<span class="flex shrink-0 flex-col items-end gap-1 pe-1">
							<Badge variant={alternative.rank === 1 ? 'default' : 'outline'}>
								#{alternative.rank}
							</Badge>
							<span class="font-mono text-xs font-normal text-muted-foreground tabular-nums">
								{scoreFormatter.format(alternative.optimizationScore)}
							</span>
						</span>
					</Accordion.Trigger>
					<Accordion.Content>
						{#if alternative.criteria.length}
							<dl class="grid gap-2 sm:grid-cols-2">
								{#each alternative.criteria as criterion (criterion.criterionId)}
									<div class="flex min-w-0 flex-col gap-1 rounded-md border px-3 py-2">
										<dt class="text-xs text-muted-foreground">{criterion.name}</dt>
										<dd class="flex flex-wrap items-center gap-2 text-sm">
											<span class="font-medium wrap-break-word">
												{formatCriterionValue(criterion)}
											</span>
											<Badge variant={criterion.type === 'benefit' ? 'success' : 'destructive'}>
												{criterion.type === 'benefit' ? 'Benefit' : 'Cost'}
											</Badge>
											<span class="text-xs text-muted-foreground">
												Bobot {percentFormatter.format(criterion.weight)}
											</span>
										</dd>
									</div>
								{/each}
							</dl>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</Card.Content>
</Card.Root>
