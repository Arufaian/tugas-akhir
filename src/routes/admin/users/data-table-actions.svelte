<script lang="ts">
	import BanIcon from '@lucide/svelte/icons/ban';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { UserRow } from './types.js';

	let { user }: { user: UserRow } = $props();
</script>

<div class="flex justify-center">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${user.name}`}>
					<EllipsisIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-44">
			<DropdownMenu.Group>
				<DropdownMenu.Item disabled>
					{#if user.isActive}
						<BanIcon />
						{user.isCurrentUser ? 'Akun yang digunakan' : 'Nonaktifkan'}
					{:else}
						<RotateCcwIcon />
						Aktifkan
					{/if}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
