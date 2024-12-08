<script lang="ts">
	import { onMount } from 'svelte';
	import PodcastPlayer from '$lib/components/PodcastPlayer.svelte';
	import BackgroundPlayer from '$lib/components/BackgroundPlayer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Check, Music, Trash2 } from 'lucide-svelte';
	import AddBackgroundMusicDialog from '$lib/components/AddBackgroundMusicDialog.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

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
	let backgroundMusicList: BackgroundMusic[] = [];

	// Load saved state on mount
	onMount(() => {
		const savedPodcastUrl = localStorage.getItem('zimmer_podcast_url');
		const savedBgUrl = localStorage.getItem('zimmer_bg_url');
		const savedTime = localStorage.getItem('zimmer_current_time');
		const storedMusic = localStorage.getItem('zimmer_background_music');

		// Initialize background music list
		backgroundMusicList = storedMusic
			? JSON.parse(storedMusic)
			: [
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
						url: 'https://www.youtube.com/watch?v=5y3JU5ZMg5Y'
					}
				];

		if (savedPodcastUrl && savedBgUrl) {
			podcastUrl = savedPodcastUrl;
			bgUrl = savedBgUrl;
			currentTime = savedTime ? parseInt(savedTime) : 0;
			showForm = false;
			startPlayback = true;

			// Find and set the selected background music
			selectedBackgroundMusic =
				backgroundMusicList.find((music) => music.url === savedBgUrl) || null;
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

	$: if (backgroundMusicList.length > 0) {
		localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
	}

	// Background music options
	interface BackgroundMusic {
		title: string;
		url: string;
	}

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
		localStorage.removeItem('zimmer_background_music');
	}

	// Delete background music
	function deleteBackgroundMusic(index: number) {
		backgroundMusicList = backgroundMusicList.filter((_, i) => i !== index);
		localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
		if (
			selectedBackgroundMusic &&
			!backgroundMusicList.find((music) => music.url === selectedBackgroundMusic?.url)
		) {
			selectedBackgroundMusic = null;
			bgUrl = '';
		}
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
	{#if showForm}
		<div class="text-center">
			<h1 class="text-4xl font-bold font-display">Zimmer</h1>
			<p class="text-muted-foreground mt-2">Create your perfect listening experience</p>
		</div>
	{/if}

	{#if isInitializing}
		<div class="fixed inset-0 bg-background flex flex-col items-center justify-center space-y-6">
			<h1 class="text-2xl font-bold">Zimmer</h1>
			<!-- <div class="w-16 h-16 border-4 border-t-primary animate-spin rounded-full"></div> -->
			<!-- <p class="text-xl font-medium">Loading your session...</p> -->
		</div>
	{:else if showForm}
		<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
			<div class="space-y-2 flex items-center flex-col justify-center">
				<!-- <h2 class="text-lg font-semibold">Enter Podcast URL</h2> -->
				<Input
					type="text"
					bind:value={podcastUrl}
					placeholder="Enter YouTube URL for Podcast"
					class=" w-full max-w-lg"
				/>

				<Input
					type="text"
					bind:value={bgUrl}
					placeholder="Enter YouTube URL for background music"
					class="w-full max-w-lg"
				/>
				<div class="max-w-lg flex justify-end w-full">
					<Button type="submit" class=" self-end" disabled={!podcastUrl || !bgUrl}
						>Start Session</Button
					>
				</div>
			</div>

			<div class="space-y-4 ms:px-5 px-10">
				<div class="space-y-4">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<span class="w-full border-t"></span>
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-background px-2 text-muted-foreground"
								>Or choose from saved music</span
							>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						{#each backgroundMusicList as music, index}
							<Card
								class="relative  cursor-pointer hover:bg-accent transition-colors {selectedBackgroundMusic?.url ===
								music.url
									? 'bg-accent'
									: ''}"
								onclick={() => {
									selectedBackgroundMusic = music;
									bgUrl = music.url;
								}}
							>
								<CardHeader class="px-4 py-3">
									<div class="flex items-start justify-between">
										<div class="space-y-0.5">
											<CardTitle class="">{music.title}</CardTitle>
											<CardDescription class="mt-1">
												<Music width={10} class="h-3 mt-1 w-3" />
											</CardDescription>
										</div>
										<div class="flex gap-2 flex-col">
											<!-- {#if selectedBackgroundMusic?.url === music.url}
												<Check width={12} class="h-4 w-4 mb-1 text-primary" />
											{/if} -->
											<button
												class="text-destructive hover:text-destructive/80 transition-colors"
												on:click|stopPropagation={() => deleteBackgroundMusic(index)}
											>
												<Trash2 width={12} class="h-4 w-4" />
											</button>
										</div>
									</div>
								</CardHeader>
							</Card>
						{/each}
					</div>

					<AddBackgroundMusicDialog
						on:addMusic={(event) => {
							const newMusic = event.detail;
							backgroundMusicList = [...backgroundMusicList, newMusic];
							localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
							selectedBackgroundMusic = newMusic;
							bgUrl = newMusic.url;
						}}
					/>
				</div>
			</div>
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
