<script lang="ts">
	import { navigating } from '$app/state';
	import { fade } from 'svelte/transition';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
</script>

{#if navigating.to}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-999 flex items-center justify-center bg-background/80 backdrop-blur-sm"
	>
		<div class="flex flex-col items-center gap-4">
			<Spinner class="size-10 text-primary" />
			<span class="typing-text text-lg font-semibold text-primary">Loading...</span>
		</div>
	</div>
{/if}

<style>
	.typing-text {
		display: inline-block;
		overflow: hidden;
		white-space: nowrap;
		border-right: 2px solid currentColor;
		width: 0;
		animation:
			typing 1.5s steps(10) forwards alternate infinite,
			blink 0.75s step-end infinite;
	}

	@keyframes typing {
		to {
			width: 7ch;
		}
	}

	@keyframes blink {
		50% {
			border-color: transparent;
		}
	}
</style>
