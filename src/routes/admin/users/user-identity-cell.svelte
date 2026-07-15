<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { getInitials } from '$lib/utils/string.js';

	import type { UserRow } from './types.js';

	let { user }: { user: UserRow } = $props();
</script>

<div class="flex min-w-56 items-center gap-3">
	<Avatar.Root>
		<Avatar.Fallback>{getInitials(user.name)}</Avatar.Fallback>
	</Avatar.Root>
	<div class="min-w-0">
		<div class="flex items-center gap-2">
			<span class="truncate font-medium">{user.name}</span>
			{#if user.isCurrentUser}
				<Badge variant="outline">Anda</Badge>
			{/if}
		</div>
		<p class="truncate text-sm text-muted-foreground">{user.email}</p>
	</div>
</div>
