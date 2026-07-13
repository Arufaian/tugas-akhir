<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LightSwitch from '$lib/components/ui/light-switch/light-switch.svelte';
	let { data, children } = $props();

	const breadcrumbLabels: Record<string, string> = {
		admin: 'Admin',
		dashboard: 'Dashboard',
		alternatives: 'Alternatif',
		criteria: 'Kriteria',
		create: 'Tambah',
		update: 'Edit',
		scales: 'Nilai kriteria skala',
		'alternative-values': 'Nilai alternatif',
		'moora-calculation': 'Perhitungan MOORA'
	};

	const breadcrumbs = $derived.by(() => {
		let href = '';

		return (
			page.url.pathname
				.split('/')
				.filter(Boolean)
				// ponytail: hide dynamic ids; fetch entity names later if breadcrumbs need record-level context.
				.filter((segment) => breadcrumbLabels[segment])
				.map((segment) => {
					href += `/${segment}`;

					return {
						href,
						label: breadcrumbLabels[segment]
					};
				})
		);
	});
</script>

<svelte:head>
	<title>Admin dashboard</title>
</svelte:head>

{#if data.profile}
	<Sidebar.Provider>
		<AppSidebar user={data.profile} />
		<Sidebar.Inset class="min-w-0">
			<header
				class="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<div class="flex items-center gap-2 px-4">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#each breadcrumbs as breadcrumb, index (breadcrumb.href)}
								{#if index > 0}
									<Breadcrumb.Separator class="hidden md:block" />
								{/if}

								<Breadcrumb.Item class={index === 0 ? 'hidden md:block' : undefined}>
									{#if index === breadcrumbs.length - 1}
										<Breadcrumb.Page>{breadcrumb.label}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={breadcrumb.href}>{breadcrumb.label}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>

				<div class=" flex items-center gap-2 px-4">
					<LightSwitch size="default" />
				</div>
			</header>
			<div class="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{:else}
	<div class="flex h-screen w-full items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Loading...</h1>
			<p class="text-muted-foreground">Initializing your dashboard</p>
		</div>
	</div>
{/if}
