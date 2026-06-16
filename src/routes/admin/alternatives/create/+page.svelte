<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		createAlternativeSchema,
		type CreateAlternativeSchema
	} from '$lib/validations/alternative.schema.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import { onDestroy } from 'svelte';

	let { data }: { data: { form: SuperValidated<Infer<CreateAlternativeSchema>> } } = $props();

	const supabase = page.data.supabase;
	let formSubmitted = $state(false);

	const initialForm = () => data.form;
	const form = superForm(initialForm(), {
		validators: zod4Client(createAlternativeSchema),
		onUpdated({ form: f }) {
			if (f.message?.type === 'success') {
				formSubmitted = true;
				toast.success(f.message.text);
				setTimeout(() => goto(resolve('/admin/alternatives')), 1500);
			} else if (f.message?.type === 'error') {
				toast.error(f.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	const categories = [
		{ value: 'Classy', label: 'Classy' },
		{ value: 'Matic', label: 'Matic' },
		{ value: 'MAXi', label: 'MAXi' },
		{ value: 'Moped', label: 'Moped' },
		{ value: 'Sport', label: 'Sport' },
		{ value: 'Off-Road', label: 'Off-Road' }
	];

	const selectedCategory = $derived(
		$formData.category
			? categories.find((c) => c.value === $formData.category)?.label
			: 'Pilih kategori'
	);

	type UploadedFile = {
		name: string;
		type: string;
		size: number;
		uploadedAt: number;
		url: string;
		storagePath: string;
	};

	let files = $state<UploadedFile[]>([]);

	const onUpload: FileDropZone.FileDropZoneRootProps['onUpload'] = async (f) => {
		await Promise.allSettled(f.map((file) => uploadFile(file)));
	};

	const onFileRejected: FileDropZone.FileDropZoneRootProps['onFileRejected'] = async ({
		reason,
		file
	}) => {
		toast.error(`${file.name} gagal diupload`, { description: reason });
	};

	const uploadFile = async (file: File) => {
		if (files.find((f) => f.name === file.name)) return;
		if (!supabase) return;

		const ext = file.name.split('.').pop();
		const storagePath = `alternative-image/${Date.now()}-${crypto.randomUUID()}.${ext}`;

		const { data: uploadData, error } = await supabase.storage
			.from('tugas-akhir')
			.upload(storagePath, file);

		toast.success(`Gambar berhasil diupload`);

		if (error) {
			toast.error(`Gagal upload ${file.name}`, { description: error.message });
			return;
		}

		const { data: urlData } = supabase.storage.from('tugas-akhir').getPublicUrl(uploadData.path);

		files.push({
			name: file.name,
			type: file.type,
			size: file.size,
			uploadedAt: Date.now(),
			url: urlData.publicUrl,
			storagePath: uploadData.path
		});

		$formData.imgUrl = urlData.publicUrl;
	};

	const removeFile = async (index: number) => {
		const file = files[index];
		if (!file) return;
		if (!supabase) return;

		try {
			const { error } = await supabase.storage.from('tugas-akhir').remove([file.storagePath]);
			toast.success(`${file.name} berhasil dihapus`);
			if (error) throw error;
		} catch (err) {
			toast.error('Gagal menghapus gambar');
			console.error(err);
			return;
		}

		files = [...files.slice(0, index), ...files.slice(index + 1)];
		$formData.imgUrl = '';
	};

	onDestroy(async () => {
		if (formSubmitted) return;
		if (!supabase || files.length === 0) return;

		for (const file of files) {
			try {
				await supabase.storage.from('tugas-akhir').remove([file.storagePath]);
			} catch {
				// cleanup failure is non-critical
			}
		}

		files = [];
	});
</script>

<svelte:head>
	<title>Tambah Alternatif</title>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl font-semibold tracking-tight"
			>Tambah Alternatif</Card.Title
		>
		<Card.Description class="text-sm text-muted-foreground">
			Isi informasi lengkap tentang motor yang akan ditambahkan
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<form method="POST" use:enhance class="flex flex-col gap-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Form.Field {form} name="category">
					<Form.Control>
						{#snippet children({ props: { name: fieldName, ...triggerProps } })}
							<Form.Label>Kategori</Form.Label>
							<Select.Root type="single" name={fieldName} bind:value={$formData.category}>
								<Select.Trigger class="w-full" {...triggerProps}>
									{selectedCategory}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										{#each categories as cat (cat.value)}
											<Select.Item value={cat.value}>{cat.label}</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Nama</Form.Label>
							<Input {...props} bind:value={$formData.name} placeholder="Nama lengkap motor" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<FileDropZone.Root
				{onUpload}
				{onFileRejected}
				maxFileSize={FileDropZone.MEGABYTE * 2}
				accept="image/*"
				maxFiles={1}
				fileCount={files.length}
			>
				<FileDropZone.Trigger />
			</FileDropZone.Root>

			{#if files.length > 0}
				<div class="flex flex-col gap-2">
					{#each files as file, i (file.name)}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<div class="relative size-9 overflow-clip rounded">
									<img
										src={file.url}
										alt={file.name}
										class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
									/>
								</div>
								<div class="flex flex-col">
									<span class="text-sm text-nowrap">{file.name}</span>
									<span class="text-xs text-muted-foreground"
										>{FileDropZone.displaySize(file.size)}</span
									>
								</div>
							</div>
							<Button variant="outline" size="icon" onclick={() => removeFile(i)}>
								<XIcon />
							</Button>
						</div>
					{/each}
				</div>
			{/if}

			<input name="imgUrl" bind:value={$formData.imgUrl} />

			<div class="flex justify-end gap-2">
				<Button href={resolve('/admin/alternatives')} variant="outline">Batal</Button>
				<Form.Button disabled={$submitting}>
					{#if $submitting}
						<Spinner />
						Menyimpan...
					{:else}
						Simpan
					{/if}
				</Form.Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
