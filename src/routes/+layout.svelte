<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '$lib/assets/favicon.png';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import LoadingOverlay from '$lib/components/loading-overlay.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<LoadingOverlay />
<ModeWatcher />
<Toaster richColors />
{@render children()}
