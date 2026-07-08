<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		href,
		label = 'Kembali',
		class: className,
		...restProps
	}: ButtonProps & {
		href: string;
		label?: string;
	} = $props();
</script>

<Button
	variant="link"
	{href}
	class={cn('w-fit px-0 text-muted-foreground', className)}
	{...restProps}
>
	<ArrowLeft />
	{label}
</Button>
