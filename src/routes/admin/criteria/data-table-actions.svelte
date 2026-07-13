<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import PowerIcon from '@lucide/svelte/icons/power';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ConfirmDeleteDialog from '$lib/components/confirm-delete-dialog.svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		id,
		name,
		inputType,
		isActive,
		showScaleWarning = false
	}: {
		id: string;
		name: string;
		inputType: string;
		isActive: boolean;
		showScaleWarning?: boolean;
	} = $props();

	let showDialog = $state(false);
	let isDeleting = $state(false);
	let isUpdatingStatus = $state(false);

	async function handleStatusChange() {
		isUpdatingStatus = true;
		const nextStatus = !isActive;

		try {
			const res = await fetch(`/admin/criteria/${id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ isActive: nextStatus })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Gagal mengubah status kriteria');
			}

			toast.success(
				nextStatus ? 'Kriteria berhasil diaktifkan' : 'Kriteria berhasil dinonaktifkan'
			);
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
		} finally {
			isUpdatingStatus = false;
		}
	}

	async function handleDelete() {
		isDeleting = true;
		try {
			const res = await fetch(`/admin/criteria/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Gagal menghapus kriteria');
			}
			toast.success('Kriteria berhasil dihapus');
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
					{#if showScaleWarning}
						<span
							class="absolute top-0 right-0 size-2 rounded-full bg-destructive ring-2 ring-card"
							aria-hidden="true"
						></span>
						<span class="sr-only">Kriteria skala belum punya skala</span>
					{/if}
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="mr-4">
			<DropdownMenu.Item onclick={() => goto(resolve(`/admin/criteria/${id}/update`))}>
				<PencilIcon />
				Edit
			</DropdownMenu.Item>
			{#if inputType === 'scale'}
				<DropdownMenu.Item onclick={() => goto(resolve(`/admin/criteria/${id}/scales`))}>
					<RulerIcon />
					Skala

					{#if showScaleWarning}
						<span
							class="absolute top-0 right-0 size-2 rounded-full bg-destructive ring-2 ring-card"
							aria-hidden="true"
						></span>
						<span class="sr-only">Kriteria skala belum punya skala</span>
					{/if}
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item disabled={isUpdatingStatus} onclick={handleStatusChange}>
				<PowerIcon />
				{isActive ? 'Nonaktifkan' : 'Aktifkan'}
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				variant="destructive"
				disabled={isUpdatingStatus}
				onclick={() => (showDialog = true)}
			>
				<Trash2Icon />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<ConfirmDeleteDialog bind:open={showDialog} {name} loading={isDeleting} onConfirm={handleDelete} />
