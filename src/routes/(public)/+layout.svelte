<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { toast } from 'svelte-sonner';
	import logo from '$lib/assets/favicon1.png';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavMenu from '$lib/components/nav-menu.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import LightSwitch from '$lib/components/ui/light-switch/light-switch.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getInitials } from '$lib/utils/string';

	let { data, children } = $props();
	let logoutForm = $state<HTMLFormElement>();
</script>

<form
	action={resolve('/auth/logout')}
	method="POST"
	bind:this={logoutForm}
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				toast.error(
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Gagal logout, silakan coba lagi.'
				);
				return;
			}

			if (result.type === 'error') {
				toast.error('Terjadi gangguan saat logout. Silakan coba lagi.');
				return;
			}

			await update();
		};
	}}
	class="hidden"
></form>

<Sidebar.Provider>
	{#if data.profile?.role === 'admin'}
		<div class="block md:hidden">
			<AppSidebar user={data.profile} collapsible="offcanvas" />
		</div>
	{/if}
	<Sidebar.Inset>
		<header
			class=" flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 shadow backdrop-blur-sm lg:px-8"
		>
			<div class="flex items-center md:hidden">
				{#if data.profile?.role === 'admin'}
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				{:else}
					<a
						href={resolve('/')}
						aria-label="Yamaha Mekar"
						class="rounded-md focus-visible:outline-2"
					>
						<img src={logo} alt="" class="size-8 object-contain" />
					</a>
				{/if}
			</div>
			<div class="hidden md:flex">
				<NavMenu />
			</div>

			<div class="flex min-w-0 items-center gap-2 sm:gap-4">
				<LightSwitch size="default" />
				<Separator orientation="vertical" class="data-[orientation=vertical]:h-8" />
				{#if !data.profile}
					<Button variant="outline" href={resolve('/auth/login')}>Login</Button>
					<Button href={resolve('/auth/register')}>Register</Button>
				{:else if data.profile.role === 'admin'}
					<Button href={resolve('/admin/dashboard')}>
						<LayoutDashboardIcon data-icon="inline-start" />
						Dashboard
					</Button>
				{:else}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									class="  h-auto max-w-52 min-w-0 justify-start p-0 pr-1.5 sm:max-w-64 md:p-1.5"
									aria-label="Buka menu akun"
								>
									<Avatar.Root class="size-8 shrink-0">
										<Avatar.Fallback>{getInitials(data.profile.name) || '?'}</Avatar.Fallback>
									</Avatar.Root>
									<span class=" hidden min-w-0 flex-1 text-start leading-tight md:grid">
										<span class="truncate text-sm font-medium">{data.profile.email}</span>
										<span class="truncate text-xs text-muted-foreground capitalize"
											>{data.profile.role}</span
										>
									</span>
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-64">
							<DropdownMenu.Label class="font-normal">
								<div class="flex items-center gap-2">
									<Avatar.Root class="size-9">
										<Avatar.Fallback>{getInitials(data.profile.name) || '?'}</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid min-w-0 flex-1 leading-tight">
										<span class="truncate text-sm font-medium">{data.profile.name}</span>
										<span class="truncate text-xs text-muted-foreground">{data.profile.email}</span>
										<span class="text-xs text-muted-foreground capitalize">{data.profile.role}</span
										>
									</div>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item
									variant="destructive"
									onclick={() => logoutForm?.requestSubmit()}
								>
									<LogOutIcon />
									Log out
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</div>
		</header>

		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
