<script lang="ts" module>
	import { LayoutDashboard, Motorbike, ListCheck, ClipboardList, UsersRound } from '@lucide/svelte';

	// akan dibuat sebuah constant ketika role sales mulai dikerjakan
	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/admin/dashboard',
				icon: LayoutDashboard
			},
			{
				title: 'Users',
				url: '/admin/users',
				icon: UsersRound
			},
			{
				title: 'Alternatives',
				url: '/admin/alternatives',
				icon: Motorbike
			},
			{
				title: 'Criteria',
				url: '/admin/criteria',
				icon: ListCheck
			},
			{
				title: 'Alternative Values',
				url: '/admin/alternative-values',
				icon: ClipboardList
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavCalculations from './nav-calculations.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { UserProfileData } from '$lib/types/user-profile';

	type AppSidebarProps = ComponentProps<typeof Sidebar.Root> & {
		user: UserProfileData | null;
	};

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		...restProps
	}: AppSidebarProps = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<NavUser {user} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavCalculations />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
