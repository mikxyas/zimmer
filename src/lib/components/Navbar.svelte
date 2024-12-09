<script lang="ts">
	import { Moon, Sun, Lock, RotateCcw, Play, Pause } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { theme, toggleTheme } from '$lib/stores/theme';

	export let onLock: () => void;
	export let onReset: () => void;
	export let showPlayerControls: boolean = false;
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container max-w-md px-4 h-14 flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<span class="text-lg font-semibold">Zimmer</span>
		</div>

		<div class="flex items-center space-x-2">
			<Button variant="ghost" size="icon" onclick={onReset}>
				<RotateCcw class="h-5 w-5" />
			</Button>
			{#if showPlayerControls}
				<Button variant="ghost" size="icon" onclick={onLock}>
					<Lock class="h-5 w-5" />
				</Button>
			{/if}

			<Button variant="ghost" size="icon" onclick={toggleTheme}>
				{#if $theme === 'dark'}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</Button>
		</div>
	</div>
</nav>
