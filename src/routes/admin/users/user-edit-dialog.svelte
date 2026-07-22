<script lang="ts">
	import type { SuperForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	type EditForm = SuperForm<{ userId: string; name: string; email: string }>;

	let {
		open = $bindable(false),
		form,
		onClose
	}: {
		open: boolean;
		form: EditForm;
		onClose: () => void;
	} = $props();

	const initialForm = () => form;
	const { form: formData, enhance, submitting } = initialForm();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<form method="POST" action="?/update" use:enhance class="contents">
			<input type="hidden" name="userId" value={$formData.userId} />

			<Dialog.Header>
				<Dialog.Title>Edit pengguna</Dialog.Title>
				<Dialog.Description>
					Perbarui nama atau email pengguna tanpa mengubah role dan aksesnya.
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-4">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Nama lengkap</Form.Label>
							<Input {...props} bind:value={$formData.name} autocomplete="name" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input {...props} type="email" bind:value={$formData.email} autocomplete="email" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" disabled={$submitting} onclick={onClose}>
					Batal
				</Button>
				<Form.Button disabled={$submitting}>
					{#if $submitting}
						<Spinner data-icon="inline-start" />
						Menyimpan...
					{:else}
						Simpan perubahan
					{/if}
				</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
