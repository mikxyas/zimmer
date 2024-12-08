<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import '../app.css';

	let { children } = $props();
	let installPrompt: any = null;
	let showInstallButton = false;
	let isAppInstalled = false;

	function checkStandaloneMode() {
		// Multiple methods to detect standalone mode
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			// @ts-ignore
			window.navigator.standalone === true ||
			(window as any).standalone === true;

		if (isStandalone) {
			document.body.classList.add('standalone');
			document.documentElement.classList.add('standalone');

			// Adjust viewport for standalone mode
			const metaViewport = document.querySelector('meta[name="viewport"]');
			if (!metaViewport) {
				const viewport = document.createElement('meta');
				viewport.name = 'viewport';
				viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
				document.head.appendChild(viewport);
			}

			// console.log('Standalone mode detected and configured');
		} else {
			// console.log('Not in standalone mode');
		}
	}

	onMount(() => {
		// Detect standalone mode on mount and when display mode changes
		checkStandaloneMode();

		// Listen for display mode changes
		const mediaQuery = window.matchMedia('(display-mode: standalone)');
		mediaQuery.addEventListener('change', checkStandaloneMode);

		// Check if the app is already installed
		if ('getInstalledRelatedApps' in navigator) {
			(navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
				isAppInstalled = relatedApps.length > 0;
			});
		}

		if ('serviceWorker' in navigator) {
			// Register service worker
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((registration) => {
					// console.log('Service Worker registered with scope:', registration.scope);
				})
				.catch((error) => {
					console.error('Service Worker registration failed:', error);
				});

			// Handle install prompt
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				installPrompt = e;
				showInstallButton = true;
				// console.log('PWA install prompt is available');
			});

			// Hide install button if app is installed
			window.addEventListener('appinstalled', () => {
				showInstallButton = false;
				isAppInstalled = true;
				installPrompt = null;

				// Recheck standalone mode after installation
				checkStandaloneMode();
			});
		}

		// Cleanup
		return () => {
			const mediaQuery = window.matchMedia('(display-mode: standalone)');
			mediaQuery.removeEventListener('change', checkStandaloneMode);
		};
	});

	function handleInstallPWA() {
		if (installPrompt && !isAppInstalled) {
			installPrompt.prompt();
			installPrompt.userChoice.then((choiceResult: any) => {
				if (choiceResult.outcome === 'accepted') {
					// console.log('User accepted the PWA installation');
					showInstallButton = false;
					isAppInstalled = true;
				} else {
					// console.log('User dismissed the PWA installation');
				}
				installPrompt = null;
			});
		}
	}
</script>

<svelte:head>
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#000000" />
	<meta name="description" content="Zimmer Podcast Player" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
	/>
</svelte:head>

{#if showInstallButton && !isAppInstalled}
	<div class="pwa-install-banner">
		<Button
			variant="default"
			onclick={handleInstallPWA}
			class="bg-blue-500 hover:bg-blue-700 text-white"
		>
			Install Zimmer Podcast Player
		</Button>
	</div>
{/if}

{@render children()}

<style>
	.pwa-install-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background-color: rgba(240, 240, 240, 0.9);
		padding: 10px;
		text-align: center;
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Styles for standalone mode */
	:global(.standalone) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		height: 100vh;
		width: 100vw;
	}

	:global(html.standalone) {
		overflow: hidden;
		position: fixed;
		width: 100%;
		height: 100%;
	}

	:global(body.standalone) {
		overflow: hidden;
		position: fixed;
		width: 100%;
		height: 100%;
	}
</style>
