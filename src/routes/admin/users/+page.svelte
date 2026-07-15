<script lang="ts">
	import UserCheckIcon from '@lucide/svelte/icons/user-check';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import UserXIcon from '@lucide/svelte/icons/user-x';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';

	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { DataTable } from '$lib/components/ui/data-table/index.js';

	import type { PageData } from './$types.js';
	import { columns } from './columns.js';
	import UserFormDialog from './user-form-dialog.svelte';

	let { data }: { data: PageData } = $props();
	let dialogOpen = $state(false);

	const roleOptions = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'sales', label: 'Sales' }
	];

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Pengguna</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="font-display text-2xl font-semibold tracking-tight">Pengguna</h1>
				<Badge variant="secondary">Data mock</Badge>
			</div>
			<p class="text-sm text-muted-foreground">Kelola akun dan akses staf.</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<UsersRoundIcon class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Total Pengguna</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.total}
				</span>
				<span class="text-xs text-muted-foreground/70">akun terdaftar</span>
				<Button variant="outline" size="sm" onclick={() => (dialogOpen = true)}>
					<UserPlusIcon data-icon="inline-start" />
					Tambah user
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-success/10 text-success"
					>
						<UserCheckIcon class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Akses Aktif</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.active}
				</span>
				<span class="text-xs text-muted-foreground/70">dapat masuk ke sistem</span>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex size-8 items-center justify-center rounded-md bg-destructive/10 text-destructive"
					>
						<UserXIcon class="size-4" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">Dinonaktifkan</span>
				</div>
				<span class="font-display text-3xl leading-none font-semibold tracking-tighter">
					{data.summary.inactive}
				</span>
				<span class="text-xs text-muted-foreground/70">akses login diblokir</span>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="rounded-xl border bg-card">
		<DataTable
			data={data.users}
			{columns}
			filterColumn="identity"
			filterPlaceholder="Cari nama atau email..."
			emptyMessage="Pengguna tidak ditemukan."
			facetedFilters={[
				{ columnId: 'role', title: 'Role', options: roleOptions },
				{ columnId: 'status', title: 'Status', options: statusOptions }
			]}
		/>
	</div>
</div>

<UserFormDialog bind:open={dialogOpen} data={data.form} />
