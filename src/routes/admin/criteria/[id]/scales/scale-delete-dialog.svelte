<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	type Scale = PageData['scales'][number];
	type DeleteForm = SuperForm<{ scaleId: string }>;

	let {
		open = $bindable(false),
		scale,
		form,
		onClose
	}: {
		open: boolean;
		scale: Scale | null;
		form: DeleteForm;
		onClose: () => void;
	} = $props();

	const initialForm = () => form;
	const { form: formData, enhance, submitting } = initialForm();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		{#if scale}
			<form method="POST" action="?/delete" use:enhance>
				<Dialog.Header>
					<Dialog.Title>Hapus Skala</Dialog.Title>
					<Dialog.Description class="pb-8">
						Yakin ingin menghapus "{scale.label}"?
					</Dialog.Description>
				</Dialog.Header>

				<Dialog.Footer>
					<Button variant="outline" onclick={onClose} type="button">Batal</Button>
					<input type="hidden" name="scaleId" bind:value={$formData.scaleId} />

					<Form.Button variant="destructive" type="submit" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
							Menghapus...
						{:else}
							Hapus
						{/if}
					</Form.Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
