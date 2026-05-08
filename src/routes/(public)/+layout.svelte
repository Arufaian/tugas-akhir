<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavMenu from '$lib/components/nav-menu.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import LightSwitch from '$lib/components/ui/light-switch/light-switch.svelte';
	import { useMedia } from '$lib/hooks/use-media.svelte';

	let { data, children } = $props();

	const media = useMedia();
	const isMobile = $derived(!media.md);

	$inspect(isMobile);
</script>

<Sidebar.Provider>
	{#if isMobile}
		<AppSidebar user={data.profile} collapsible="offcanvas" />
	{/if}
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-8">
			{#if isMobile}
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="##">Build Your Application</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			{:else}
				<NavMenu />
			{/if}

			<div class="flex items-center gap-4">
				<LightSwitch size="default" />

				<Separator orientation="vertical" class="  data-[orientation=vertical]:h-8 " />

				<Button>Login</Button>
			</div>
		</header>

		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
