<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CalculatorIcon from '@lucide/svelte/icons/calculator';

	const url = resolve('/admin/moora-calculation');
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Perhitungan</Sidebar.GroupLabel>
	<Sidebar.Menu>
		<Sidebar.MenuItem>
			<!-- ponytail: one calculation route does not need configurable menu data. -->
			<Sidebar.MenuButton isActive={page.url.pathname === url} tooltipContent="MOORA Calculation">
				{#snippet child({ props })}
					<a href={url} {...props}>
						<CalculatorIcon />
						<span>MOORA Calculation</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
