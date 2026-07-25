<script lang="ts">
	import { resolve } from '$app/paths';
	import errorIllustration from '$lib/assets/error.svg';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<svelte:head>
	<title>Konfirmasi Email Gagal | Yamaha Mekar</title>
</svelte:head>

<main class="flex min-h-svh items-center justify-center bg-card p-6 md:p-10">
	<Card.Root class="max-h-64 w-full max-w-sm border-0 shadow-none ring-0">
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Konfirmasi email gagal</Card.Title>
			<Card.Description>
				Tautan konfirmasi tidak valid, sudah digunakan, atau telah kedaluwarsa.
			</Card.Description>
		</Card.Header>
		<Card.Content class="w-10">
			<img
				src={errorIllustration}
				alt="Ilustrasi tautan konfirmasi email yang tidak valid"
				class="mx-auto w-10 object-contain"
			/>
		</Card.Content>
		<Card.Footer class="flex-col gap-2 ">
			<Button href={resolve('/auth/login')} class="w-full">Ke halaman login</Button>
			<Button href={resolve('/auth/register')} variant="outline" class="w-full">Daftar ulang</Button
			>
		</Card.Footer>
	</Card.Root>
</main>
