<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavMenu from '$lib/components/nav-menu.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { resolve } from '$app/paths';
	import LightSwitch from '$lib/components/ui/light-switch/light-switch.svelte';

	let { data, children } = $props();
</script>

<Sidebar.Provider>
	<div class="block md:hidden">
		<AppSidebar user={data.profile} collapsible="offcanvas" />
	</div>
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-8">
			<div class="flex items-center md:hidden">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
			</div>
			<div class="hidden md:flex">
				<NavMenu />
			</div>

			<div class="flex items-center gap-4">
				<LightSwitch size="default" />
				<Separator orientation="vertical" class="data-[orientation=vertical]:h-8" />
				<Button variant="outline"><a href={resolve('/auth/login')}> Login </a></Button>
				<Button variant="default"><a href={resolve('/auth/register')}> Register </a></Button>
			</div>
		</header>

		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
