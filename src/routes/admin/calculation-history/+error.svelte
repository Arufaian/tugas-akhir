<script lang="ts">
	import { page } from '$app/state';
	import { CircleAlert, FileQuestion } from '@lucide/svelte';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Riwayat Tidak Ditemukan' : 'Gagal Memuat Riwayat'}</title>
</svelte:head>

{#if page.status === 404}
	<Empty.Root class="border border-dashed">
		<Empty.Header>
			<Empty.Media variant="icon">
				<FileQuestion />
			</Empty.Media>
			<Empty.Title>Riwayat perhitungan tidak ditemukan</Empty.Title>
			<Empty.Description>
				Tautan tidak valid atau snapshot yang diminta sudah tidak tersedia.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href="/admin/calculation-history" variant="outline" size="sm">
				Kembali ke Riwayat
			</Button>
		</Empty.Content>
	</Empty.Root>
{:else}
	<div class="flex flex-col gap-4">
		<Alert.Root variant="destructive">
			<CircleAlert />
			<Alert.Title>Riwayat gagal dimuat</Alert.Title>
			<Alert.Description>
				Terjadi kendala saat memuat data. Coba kembali beberapa saat lagi.
			</Alert.Description>
		</Alert.Root>
		<Button href="/admin/calculation-history" variant="outline" class="w-fit">
			Kembali ke Riwayat
		</Button>
	</div>
{/if}
