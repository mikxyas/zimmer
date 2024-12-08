<script lang="ts">
	import { onMount } from 'svelte';
	import PodcastPlayer from '$lib/components/PodcastPlayer.svelte';
	import BackgroundPlayer from '$lib/components/BackgroundPlayer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Check } from 'lucide-svelte';

	// Component state with type definitions
	let showForm: boolean = true;
	let podcastUrl: string = '';
	let bgUrl: string = '';
	let error: string | null = null;
	let podcastPlayer: PodcastPlayer | undefined;
	let bgPlayer: BackgroundPlayer | undefined;
	let startPlayback: boolean = false;
	let selectedBackgroundMusic: { title: string; url: string } | null = null;
	let currentTime: number = 0;
	let isInitializing: boolean = true;

	// Load saved state on mount
	onMount(() => {
		const savedPodcastUrl = localStorage.getItem('zimmer_podcast_url');
		const savedBgUrl = localStorage.getItem('zimmer_bg_url');
		const savedTime = localStorage.getItem('zimmer_current_time');

		if (savedPodcastUrl && savedBgUrl) {
			podcastUrl = savedPodcastUrl;
			bgUrl = savedBgUrl;
			currentTime = savedTime ? parseInt(savedTime) : 0;
			showForm = false;
			startPlayback = true;

			// Find and set the selected background music
			selectedBackgroundMusic =
				backgroundMusicOptions.find((music) => music.url === savedBgUrl) || null;
			console.log('Restored session - Podcast:', podcastUrl);
			console.log('Restored session - Background:', bgUrl);
			console.log('Restored session - Time:', currentTime);
		}
		isInitializing = false;
	});

	// Save state when URLs change
	$: if (podcastUrl && !showForm) {
		localStorage.setItem('zimmer_podcast_url', podcastUrl);
	}

	$: if (bgUrl && !showForm) {
		localStorage.setItem('zimmer_bg_url', bgUrl);
	}

	// Background music options
	interface BackgroundMusic {
		title: string;
		url: string;
	}

	const backgroundMusicOptions: BackgroundMusic[] = [
		{
			title: 'Beethoven',
			url: 'https://www.youtube.com/watch?v=W-fFHeTX70Q'
		},
		{
			title: 'Hans Zimmer',
			url: 'https://www.youtube.com/watch?v=IqiTJK_uzUY'
		},
		{
			title: 'Mozart',
			url: 'https://www.youtube.com/watch?v=Rb0UmrCXxVA'
		},
		{
			title: 'Lofi Girl',
			url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
		},
		{
			title: 'Groovy Jazz',
			url: 'https://www.youtube.com/watch?v=vDVSGA5b05U'
		},
		{
			title: 'Mulatu Astatke',
			url: 'https://www.youtube.com/watch?v=5y3JU5ZMg5Y&pp=ygUObXVsYXR1IGFzdGF0a2U%3D'
		}
	];

	// Form handling functions
	function handleSubmit(): void {
		if (podcastUrl && bgUrl) {
			showForm = false;
			startPlayback = true;
		}
	}

	function handleReset(): void {
		showForm = true;
		podcastUrl = '';
		bgUrl = '';
		error = null;
		startPlayback = false;
		selectedBackgroundMusic = null;

		// Clear local storage
		localStorage.removeItem('zimmer_podcast_url');
		localStorage.removeItem('zimmer_bg_url');
		localStorage.removeItem('zimmer_current_time');
	}

	function selectBackgroundMusic(music: BackgroundMusic): void {
		bgUrl = music.url;
		selectedBackgroundMusic = music;
	}

	// Event handlers
	interface PlayerError {
		detail: {
			type: string;
			error: string;
		};
	}

	interface PlayerEvent {
		detail: {
			type: string;
		};
	}

	function handlePlayerError(event: PlayerError): void {
		error = `Error loading ${event.detail.type} player: ${event.detail.error}`;
	}

	function handlePlayerPlaying(event: PlayerEvent): void {
		if (event.detail.type === 'podcast' && bgPlayer) {
			bgPlayer.play();
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-md space-y-6">
	{#if isInitializing}
		<div class="fixed inset-0 bg-background flex flex-col items-center justify-center space-y-6">
			<h1 class="text-2xl font-bold">Zimmer</h1>
			<!-- <div class="w-16 h-16 border-4 border-t-primary animate-spin rounded-full"></div> -->
			<!-- <p class="text-xl font-medium">Loading your session...</p> -->
		</div>
	{:else if showForm}
		<div class="text-center space-y-4">
			<h1 class="text-2xl font-bold">Zimmer</h1>
			<p class="text-muted-foreground">Create your perfect listening experience</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Input
					type="url"
					placeholder="Podcast YouTube URL"
					bind:value={podcastUrl}
					required
					class="w-full"
				/>
			</div>

			<div class="space-y-2">
				<Input
					type="url"
					placeholder="Background Music YouTube URL"
					bind:value={bgUrl}
					required
					class="w-full"
				/>
			</div>

			<div class="space-y-2">
				<p class="text-sm text-muted-foreground text-center">Or choose background music</p>
				<div class="grid grid-cols-2 gap-2">
					{#each backgroundMusicOptions as music}
						<Card
							class="cursor-pointer hover:bg-accent transition-colors {selectedBackgroundMusic ===
							music
								? 'bg-accent'
								: ''}"
							onclick={() => selectBackgroundMusic(music)}
						>
							<CardHeader class="p-2">
								<CardTitle class="text-xs flex justify-between items-center">
									{music.title}
									{#if selectedBackgroundMusic === music}
										<Check class="w-3 h-3 text-green-500" />
									{/if}
								</CardTitle>
							</CardHeader>
						</Card>
					{/each}
				</div>
			</div>

			<Button type="submit" class="w-full" disabled={!podcastUrl || !bgUrl}>Start Listening</Button>
		</form>
	{:else}
		<div class="space-y-6">
			<div class="flex justify-between items-center">
				<h1 class="text-2xl font-bold">Zimmer</h1>
				<Button variant="outline" size="sm" onclick={handleReset}>Reset</Button>
			</div>

			{#if error}
				<div
					class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm"
					role="alert"
				>
					{error}
				</div>
			{/if}

			<div class="space-y-4">
				<PodcastPlayer
					bind:this={podcastPlayer}
					url={podcastUrl}
					initialTime={currentTime}
					autoplay={startPlayback}
					on:error={handlePlayerError}
					on:playing={handlePlayerPlaying}
				/>

				<BackgroundPlayer url={bgUrl} autoplay={startPlayback} on:error={handlePlayerError} />
			</div>
		</div>
	{/if}
</div>
