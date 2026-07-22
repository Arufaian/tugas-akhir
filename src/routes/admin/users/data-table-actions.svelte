<script lang="ts">
	import BanIcon from '@lucide/svelte/icons/ban';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { UserRow } from './types.js';

	let { user, onEdit }: { user: UserRow; onEdit: (user: UserRow) => void } = $props();
	let pending = $state(false);

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
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
