<script lang="ts">
	import BanIcon from '@lucide/svelte/icons/ban';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import ConfirmDeleteDialog from '$lib/components/confirm-delete-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { UserRow } from './types.js';

	let { user, onEdit }: { user: UserRow; onEdit: (user: UserRow) => void } = $props();
	let pending = $state(false);
	let deleteDialogOpen = $state(false);

	async function updateStatus() {
		pending = true;

		try {
			const response = await fetch(`/admin/users/${user.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ isActive: !user.isActive })
			});
			const body = (await response.json().catch(() => ({}))) as { message?: string };

			if (!response.ok) throw new Error(body.message ?? 'Gagal mengubah status pengguna.');

			toast.success(user.isActive ? 'Pengguna dinonaktifkan.' : 'Pengguna diaktifkan.');
			await invalidateAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gagal mengubah status pengguna.');
		} finally {
			pending = false;
		}
	}

	async function deleteUser() {
		pending = true;

		try {
			const response = await fetch(`/admin/users/${user.id}`, { method: 'DELETE' });
			const body = (await response.json().catch(() => ({}))) as { message?: string };

			if (!response.ok) throw new Error(body.message ?? 'Gagal menghapus pengguna.');

			toast.success('Pengguna berhasil dihapus.');
			deleteDialogOpen = false;
			await invalidateAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gagal menghapus pengguna.');
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex justify-center">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					disabled={pending}
					aria-label={`Aksi untuk ${user.name}`}
				>
					<EllipsisIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-44">
			<DropdownMenu.Group>
				<DropdownMenu.Item disabled={pending} onclick={() => onEdit(user)}>
					<PencilIcon />
					Edit
				</DropdownMenu.Item>
				<DropdownMenu.Item
					variant={user.isActive ? 'destructive' : 'default'}
					disabled={pending || (user.isCurrentUser && user.isActive)}
					onclick={updateStatus}
				>
					{#if user.isActive}
						<BanIcon />
						{pending ? 'Memproses...' : user.isCurrentUser ? 'Akun yang digunakan' : 'Nonaktifkan'}
					{:else}
						<RotateCcwIcon />
						{pending ? 'Memproses...' : 'Aktifkan'}
					{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					variant="destructive"
					disabled={pending || user.role === 'admin'}
					onclick={() => (deleteDialogOpen = true)}
				>
					<Trash2Icon />
					{user.role === 'admin' ? 'Admin tidak dapat dihapus' : 'Hapus'}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<ConfirmDeleteDialog
	bind:open={deleteDialogOpen}
	name={user.name}
	loading={pending}
	onConfirm={deleteUser}
	title="Hapus Pengguna"
/>
