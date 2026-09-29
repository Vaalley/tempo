<script lang="ts">
	import { toggleMode } from 'mode-watcher';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { Button } from '$lib/components/ui/button';
</script>

<Button
	variant="outline"
	size="icon"
	class="fixed right-4 bottom-4 z-50"
	onclick={toggleMode}
	aria-label="Basculer le thème clair/sombre"
>
	<SunIcon class="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
	<MoonIcon
		class="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
	/>
</Button>
