<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ConfirmDeleteDialog from '$lib/components/confirm-delete-dialog.svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		id,
		name
	}: {
		id: string;
		name: string;
	} = $props();

	let showDialog = $state(false);
	let isDeleting = $state(false);

	async function handleDelete() {
		isDeleting = true;
		try {
			const res = await fetch(`/admin/alternatives/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Gagal menghapus alternatif');
			}
			toast.success('Alternatif berhasil dihapus');
			showDialog = false;
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="flex items-center justify-center">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
					<span class="sr-only">Open menu</span>
					<EllipsisIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="mr-4">
			<DropdownMenu.Item onclick={() => goto(resolve(`/admin/alternatives/${id}/update`))}>
				<PencilIcon />
				Edit
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onclick={() => (showDialog = true)}>
				<Trash2Icon />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<ConfirmDeleteDialog bind:open={showDialog} {name} loading={isDeleting} onConfirm={handleDelete} />
