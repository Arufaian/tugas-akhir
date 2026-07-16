<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import TrophyIcon from '@lucide/svelte/icons/trophy';

	import yamahaLogo from '$lib/assets/favicon1.png';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sistem Pendukung Keputusan Motor | Yamaha Mekar</title>
	<meta
		name="description"
		content="Sistem pendukung keputusan pemilihan motor Yamaha menggunakan metode MOORA."
	/>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
	<section class="grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
		<div class="flex flex-col items-start gap-6 lg:col-span-7">
			<Badge variant="outline">Metode MOORA</Badge>
			<div class="flex max-w-3xl flex-col gap-4">
				<p class="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
					Sistem Pendukung Keputusan
				</p>
				<h1
					class="font-display text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl"
				>
					Pilih motor dengan alasan yang bisa dijelaskan.
				</h1>
				<p class="max-w-2xl font-sans text-base leading-7 text-muted-foreground sm:text-lg">
					Bandingkan setiap alternatif secara konsisten berdasarkan kriteria benefit dan cost, lalu
					gunakan hasil perhitungan sebagai dasar rekomendasi.
				</p>
			</div>

			{#if !data.profile}
				<Button href="/auth/login" size="lg">
					Masuk ke sistem
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			{:else if data.profile.role === 'admin'}
				<Button href="/admin/dashboard" size="lg">
					Buka dashboard
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			{/if}
		</div>

		<figure class="overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-5">
			<div class="aspect-4/3 p-8 sm:p-10">
				<img
					src={data.latestAlternative?.img.url ?? yamahaLogo}
					alt={data.latestAlternative ? `Yamaha ${data.latestAlternative.name}` : 'Logo Yamaha'}
					width="960"
					height="720"
					fetchpriority="high"
					class="h-full w-full object-contain"
				/>
			</div>
			<figcaption class="flex min-h-20 items-center justify-between gap-4 border-t px-5 py-4">
				<div class="flex min-w-0 flex-col gap-1">
					<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{data.latestAlternative ? 'Alternatif terbaru' : 'Yamaha Mekar'}
					</span>
					<span class="truncate font-display font-semibold">
						{data.latestAlternative?.name ?? 'Sistem Pendukung Keputusan'}
					</span>
				</div>
				{#if data.latestAlternative?.category}
					<Badge variant="secondary">{data.latestAlternative.category}</Badge>
				{/if}
			</figcaption>
		</figure>
	</section>

	<section id="cara-kerja" class="border-t py-12 lg:py-16">
		<div class="mb-10 flex max-w-2xl flex-col gap-3">
			<p class="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Cara Kerja</p>
			<h2 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
				Dari data menjadi rekomendasi.
			</h2>
			<p class="font-sans leading-7 text-muted-foreground">
				Tiga tahap yang menjaga setiap keputusan tetap terstruktur dan dapat ditelusuri.
			</p>
		</div>

		<ol class="grid gap-8 md:grid-cols-3 md:gap-6">
			<li class="flex flex-col gap-5 border-t pt-5">
				<div class="flex items-center justify-between gap-4">
					<ClipboardListIcon class="size-6 text-primary" aria-hidden="true" />
					<span class="font-mono text-sm text-muted-foreground">01</span>
				</div>
				<div class="flex flex-col gap-2">
					<h3 class="font-display text-lg font-semibold">Kelola alternatif</h3>
					<p class="font-sans text-sm leading-6 text-muted-foreground">
						Siapkan data motor yang akan dibandingkan dalam satu decision matrix.
					</p>
				</div>
			</li>
			<li class="flex flex-col gap-5 border-t pt-5">
				<div class="flex items-center justify-between gap-4">
					<SlidersHorizontalIcon class="size-6 text-primary" aria-hidden="true" />
					<span class="font-mono text-sm text-muted-foreground">02</span>
				</div>
				<div class="flex flex-col gap-2">
					<h3 class="font-display text-lg font-semibold">Nilai setiap kriteria</h3>
					<p class="font-sans text-sm leading-6 text-muted-foreground">
						Gunakan bobot benefit dan cost yang sama untuk menilai seluruh alternatif.
					</p>
				</div>
			</li>
			<li class="flex flex-col gap-5 border-t pt-5">
				<div class="flex items-center justify-between gap-4">
					<TrophyIcon class="size-6 text-primary" aria-hidden="true" />
					<span class="font-mono text-sm text-muted-foreground">03</span>
				</div>
				<div class="flex flex-col gap-2">
					<h3 class="font-display text-lg font-semibold">Lihat hasil peringkat</h3>
					<p class="font-sans text-sm leading-6 text-muted-foreground">
						Tinjau skor optimasi sebagai dasar rekomendasi yang dapat dijelaskan.
					</p>
				</div>
			</li>
		</ol>
	</section>

	<section id="faq" class="grid gap-8 border-t py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
		<div class="flex max-w-xl flex-col gap-3 lg:col-span-4">
			<p class="text-sm font-semibold tracking-[0.16em] text-primary uppercase">FAQ</p>
			<h2 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
				Hal yang perlu diketahui.
			</h2>
			<p class="font-sans leading-7 text-muted-foreground">
				Ringkasan metode, penilaian, dan cara membaca hasil rekomendasi.
			</p>
		</div>

		<Accordion.Root type="single" class="lg:col-span-8">
			<Accordion.Item value="moora">
				<Accordion.Trigger>Apa itu metode MOORA?</Accordion.Trigger>
				<Accordion.Content class="font-sans leading-6 text-muted-foreground">
					MOORA adalah metode pengambilan keputusan yang membandingkan alternatif berdasarkan
					kriteria benefit dan cost untuk menghasilkan skor optimasi.
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="criteria">
				<Accordion.Trigger>Apa saja yang dinilai?</Accordion.Trigger>
				<Accordion.Content class="font-sans leading-6 text-muted-foreground">
					{#if data.criteria.length > 0}
						Kriteria yang digunakan adalah {data.criteria
							.map((criterion) => criterion.name)
							.join(', ')}.
					{:else}
						Belum ada kriteria aktif yang digunakan dalam perhitungan.
					{/if}
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="decision">
				<Accordion.Trigger>Apakah peringkat menjadi keputusan akhir?</Accordion.Trigger>
				<Accordion.Content class="font-sans leading-6 text-muted-foreground">
					Tidak. Hasil perhitungan merupakan rekomendasi berbasis data yang membantu pengambil
					keputusan melakukan evaluasi akhir.
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</section>

	{#if !data.profile || data.profile.role === 'admin'}
		<section
			class="mb-12 flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:mb-16"
		>
			<div class="flex max-w-2xl flex-col gap-2">
				<h2 class="font-display text-2xl font-semibold tracking-tight">
					Gunakan data yang sama untuk keputusan yang konsisten.
				</h2>
				<p class="font-sans text-sm leading-6 text-primary-foreground/80">
					Mulai kelola alternatif, nilai kriterianya, dan tinjau hasil perhitungan MOORA.
				</p>
			</div>
			{#if data.profile?.role === 'admin'}
				<Button href="/admin/dashboard" variant="secondary">
					Buka dashboard
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			{:else}
				<Button href="/auth/login" variant="secondary">
					Masuk ke sistem
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			{/if}
		</section>
	{/if}
</main>
