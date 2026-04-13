<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import yamahaLogo from '$lib/assets/favicon1.png';

	let { data } = $props();
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<div class="flex items-center gap-2 self-center font-medium">
			<figure class="max-w-8">
				<img src={yamahaLogo} alt="yamaha logo" />
			</figure>

			Yamaha Mekar
		</div>
		<LoginForm {data} />
	</div>
</div>
