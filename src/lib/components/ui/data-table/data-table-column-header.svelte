<script lang="ts" generics="TData, TValue">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Column } from '@tanstack/table-core';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	let {
		column,
		title,
		class: className,
		...restProps
	}: { column: Column<TData, TValue>; title: string } & HTMLAttributes<HTMLDivElement> = $props();
</script>

{#if !column?.getCanSort()}
	<div class={className} {...restProps}>
		{title}
	</div>
{:else}
	<div class={cn('flex items-center', className)} {...restProps}>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="sm"
						class="-ms-3 h-8 data-[state=open]:bg-secondary"
					>
						<span>{title}</span>
						{#if column.getIsSorted() === 'desc'}
							<ArrowDownIcon class="ms-2 size-4" />
						{:else if column.getIsSorted() === 'asc'}
							<ArrowUpIcon class="ms-2 size-4" />
						{:else}
							<ChevronsUpDownIcon class="ms-2 size-4" />
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.Item
					class="focus:bg-secondary dark:focus:bg-accent"
					onclick={() => column.toggleSorting(false)}
				>
					<ArrowUpIcon class="me-2 size-3.5 text-muted-foreground/70" />
					Asc
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="focus:bg-secondary dark:focus:bg-accent"
					onclick={() => column.toggleSorting(true)}
				>
					<ArrowDownIcon class="me-2 size-3.5 text-muted-foreground/70" />
					Desc
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/if}
