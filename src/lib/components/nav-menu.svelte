<script lang="ts">
	import logo from '$lib/assets/favicon1.png';

	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
</script>

<NavigationMenu.Root>
	<NavigationMenu.List class="items-center gap-3 lg:gap-4">
		<NavigationMenu.Item>
			<NavigationMenu.Link
				href="/"
				class="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold tracking-tight"
			>
				<img src={logo} alt="Yamaha Mekar" class="h-8 w-8 rounded-sm object-contain" />
			</NavigationMenu.Link>
		</NavigationMenu.Item>

		<NavigationMenu.Item>
			<NavigationMenu.Link href="/" class="px-2 py-2 font-semibold">Link</NavigationMenu.Link>
		</NavigationMenu.Item>
		<NavigationMenu.Item>
			<NavigationMenu.Link href="/" class="px-2 py-2 font-semibold">Link</NavigationMenu.Link>
		</NavigationMenu.Item>
		<NavigationMenu.Item>
			<NavigationMenu.Link href="/" class="px-2 py-2 font-semibold">Link</NavigationMenu.Link>
		</NavigationMenu.Item>
	</NavigationMenu.List>
</NavigationMenu.Root>
