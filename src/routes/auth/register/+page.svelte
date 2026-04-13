<script>
	import SignupForm from '$lib/components/signup-form.svelte';
	import logo from '$lib/assets/favicon1.png';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<div class="flex items-center gap-2 self-center font-medium">
			<figure class="max-w-8">
				<img src={logo} alt="" />
			</figure>

			Yamaha mekar
		</div>
		<SignupForm />
	</div>
</div>
