<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { registerSchema, type RegisterSchema } from '$lib/validations/register.schema.js';

	let {
		open = $bindable(false),
		data
	}: {
		open: boolean;
		data: SuperValidated<Infer<RegisterSchema>>;
	} = $props();

	const initialForm = () => data;
	const form = superForm(initialForm(), {
		validators: zod4Client(registerSchema),
		multipleSubmits: 'prevent',
		onUpdated({ form: updatedForm }) {
			if (updatedForm.message?.type === 'success') {
				toast.success(updatedForm.message.text);
				open = false;
				reset();
			} else if (updatedForm.message?.type === 'error') {
				toast.error(updatedForm.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting, reset } = form;

	function closeDialog() {
		open = false;
		reset();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<form method="POST" action="?/create" use:enhance class="contents">
			<Dialog.Header>
				<Dialog.Title>Tambah pengguna</Dialog.Title>
				<Dialog.Description>
					Akun baru dibuat sebagai sales dan langsung aktif setelah disimpan.
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-4">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Nama lengkap</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="Contoh: Budi Santoso"
								autocomplete="name"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$formData.email}
								placeholder="nama@perusahaan.com"
								autocomplete="email"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Password awal</Form.Label>
							<Input
								{...props}
								type="password"
								bind:value={$formData.password}
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>
						Minimal 8 karakter dengan huruf besar, kecil, angka, dan simbol.
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="confirmPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Konfirmasi password</Form.Label>
							<Input
								{...props}
								type="password"
								bind:value={$formData.confirmPassword}
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" disabled={$submitting} onclick={closeDialog}>
					Batal
				</Button>
				<Form.Button disabled={$submitting}>
					{#if $submitting}
						<Spinner data-icon="inline-start" />
						Memvalidasi...
					{:else}
						Simpan pengguna
					{/if}
				</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
