<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	let {
		open = $bindable(false),
		name = '',
		loading = false,
		onConfirm = () => {},
		title = 'Konfirmasi Hapus'
	}: {
		open: boolean;
		name?: string;
		loading?: boolean;
		onConfirm?: () => void;
		title?: string;
	} = $props();

	let description = $derived(
		`Apakah Anda yakin ingin menghapus "${name}"? Tindakan ini tidak dapat dibatalkan.`
	);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={loading}>Batal</AlertDialog.Cancel>
			<Button variant="destructive" disabled={loading} onclick={onConfirm}>
				{#if loading}
					<Spinner data-icon="inline-start" />
					Menghapus...
				{:else}
					Hapus
				{/if}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
