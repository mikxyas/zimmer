<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let onUnlock: () => void;

	let currentTime = '';
	let doubleTapCount = 0;
	let lastTapTime = 0;
	let unlockTimeout: any;

	function updateTime() {
		const now = new Date();
		currentTime = now.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function handleTap() {
		const now = Date.now();
		if (now - lastTapTime < 300) {
			// Double tap within 300ms
			doubleTapCount++;
			if (doubleTapCount >= 2) {
				onUnlock();
			}
		} else {
			doubleTapCount = 1;
		}
		lastTapTime = now;

		// Reset double tap count after 300ms
		clearTimeout(unlockTimeout);
		unlockTimeout = setTimeout(() => {
			doubleTapCount = 0;
		}, 300);
	}

	onMount(() => {
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	});
</script>

<div
	class="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 touch-none select-none"
	on:click={handleTap}
	transition:fade={{ duration: 200 }}
>
	<div class="text-white/90 font-medium text-6xl mb-4 font-mono tracking-tight">
		{currentTime}
	</div>

	<p class="text-white/20 text-sm mt-8">Double tap to unlock</p>
</div>

<style>
	:global(body.locked) {
		overflow: hidden;
		touch-action: none;
	}
</style>
