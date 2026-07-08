<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Component } from 'svelte';

	let {
		items
	}: {
		items: {
			title: string;
			url: string;
			icon?: Component;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();

	// ponytail: section match is enough until sidebar needs per-route metadata.
	const isActive = (url: string) => {
		if (!url.startsWith('/')) return false;

		const path = (resolve as (path: string) => string)(url);
		return page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);
	};
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{#if item.items}
				<Collapsible.Root open={item.items?.some((s) => isActive(s.url))} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton
										{...props}
										isActive={item.items?.some((s) => isActive(s.url))}
										tooltipContent={item.title}
									>
										{#if item.icon}
											<item.icon />
										{/if}
										<span>{item.title}</span>
										<ChevronRightIcon
											class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={isActive(subItem.url)}>
												{#snippet child({ props })}
													<!-- ponytail: dynamic sidebar URLs can't match SvelteKit route union -->
													<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
													<a href={(resolve as (path: string) => string)(subItem.url)} {...props}>
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={isActive(item.url)} tooltipContent={item.title}>
						{#snippet child({ props })}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={(resolve as (path: string) => string)(item.url)} {...props}>
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
