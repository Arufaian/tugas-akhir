<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import HistoryIcon from '@lucide/svelte/icons/history';

	const calculationUrl = resolve('/admin/moora-calculation');
	const historyUrl = resolve('/admin/calculation-history');
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Perhitungan</Sidebar.GroupLabel>
	<Sidebar.Menu>
		<Sidebar.MenuItem>
			<Sidebar.MenuButton
				isActive={page.url.pathname === calculationUrl}
				tooltipContent="Perhitungan MOORA"
			>
				{#snippet child({ props })}
					<a href={calculationUrl} {...props}>
						<CalculatorIcon />
						<span>Perhitungan MOORA</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
		<Sidebar.MenuItem>
			<Sidebar.MenuButton
				isActive={page.url.pathname.startsWith(historyUrl)}
				tooltipContent="Riwayat Perhitungan"
			>
				{#snippet child({ props })}
					<a href={historyUrl} {...props}>
						<HistoryIcon />
						<span>Riwayat Perhitungan</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
