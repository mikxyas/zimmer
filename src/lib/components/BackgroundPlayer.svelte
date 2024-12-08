<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { extractVideoId, isValidYoutubeUrl } from '$lib/utils/youtube';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Check, Music } from 'lucide-svelte';
	import { Trash2 } from 'lucide-svelte';
	import AddBackgroundMusicDialog from './AddBackgroundMusicDialog.svelte';

	// Type definitions
	interface BackgroundMusic {
		title: string;
		url: string;
	}

	// Props with type definitions
	export let url: string = '';
	export let autoplay: boolean = false;

	// Event dispatcher with type definitions
	const dispatch = createEventDispatcher<{
		error: { type: string; error: string };
		playing: { type: string };
		pause: { type: string };
	}>();

	// Component state with type definitions
	let iframeElement: HTMLIFrameElement;
	let videoId: string = '';
	let isPlaying: boolean = false;
	let videoInput: string = '';
	let playbackRate: number = 1;
	let volume: [number] = [50]; // Shadcn Slider uses array
	let videoQuality: 'default' | 'small' | 'tiny' = 'default';
	let customTitle: string = '';
	let customUrl: string = '';

	// Get stored music from localStorage or use default
	const getStoredMusic = (): BackgroundMusic[] => {
		const stored = localStorage.getItem('zimmer_background_music');
		return stored
			? JSON.parse(stored)
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
	};

	let backgroundMusicList = getStoredMusic();

	// Save music list to localStorage
	const saveToLocalStorage = () => {
		localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
	};

	// Add new background music
	const addBackgroundMusic = () => {
		if (!customTitle.trim() || !isValidYoutubeUrl(customUrl)) {
			alert('Please enter a valid title and YouTube URL');
			return;
		}

		backgroundMusicList = [...backgroundMusicList, { title: customTitle, url: customUrl }];
		saveToLocalStorage();
		customTitle = '';
		customUrl = '';
	};

	// Delete background music
	const deleteBackgroundMusic = (index: number) => {
		backgroundMusicList = backgroundMusicList.filter((_, i) => i !== index);
		saveToLocalStorage();
		if (selectedMusic && !backgroundMusicList.find((music) => music.url === selectedMusic?.url)) {
			selectedMusic = null;
			url = '';
			videoId = '';
		}
	};

	let selectedMusic: BackgroundMusic | null =
		backgroundMusicList.find((option) => option.url === url) || null;

	$: {
		if (url && isValidYoutubeUrl(url)) {
			videoId = extractVideoId(url);
		}

		// Update volume when volume changes
		if (iframeElement?.contentWindow) {
			iframeElement.contentWindow.postMessage(
				JSON.stringify({ event: 'command', func: 'setVolume', args: [volume[0]] }),
				'*'
			);
		}
	}

	function play(): void {
		if (iframeElement?.contentWindow) {
			iframeElement.contentWindow.postMessage(
				JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
				'*'
			);
			isPlaying = true;
			dispatch('playing', { type: 'background' });
		}
	}

	function pause(): void {
		if (iframeElement?.contentWindow) {
			iframeElement.contentWindow.postMessage(
				JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
				'*'
			);
			isPlaying = false;
			dispatch('pause', { type: 'background' });
		}
	}

	function togglePlayPause(): void {
		isPlaying ? pause() : play();
	}

	function changeVideo(): void {
		if (isValidYoutubeUrl(videoInput)) {
			localStorage.setItem('zimmer_bg_url', videoInput);
			url = videoInput;
			videoInput = '';
		} else {
			alert('Please enter a valid YouTube URL');
		}
	}

	function setPlaybackSpeed(speed: number): void {
		if (iframeElement?.contentWindow) {
			iframeElement.contentWindow.postMessage(
				JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [speed] }),
				'*'
			);
			playbackRate = speed;
		}
	}

	function toggleLowQuality(): void {
		videoQuality = videoQuality === 'tiny' ? 'default' : 'tiny';
	}

	// Listen for changes in localStorage
</script>

<div class="video-container">
	<div class="mb-4">
		<div class="flex flex-col gap-4">
			<!-- Change background form -->
			<form class="flex gap-2">
				<Input
					type="text"
					bind:value={videoInput}
					placeholder="Enter YouTube URL"
					class="flex-grow"
				/>
				<Button onclick={changeVideo} variant="default" size="sm">Change Background</Button>
			</form>
		</div>
	</div>
	{#if videoId}
		<div class="video-wrapper">
			<iframe
				bind:this={iframeElement}
				width="640"
				height="360"
				src="https://www.youtube.com/embed/{videoId}?enablejsapi=1&autoplay={autoplay
					? 1
					: 0}&controls=1&modestbranding=1&rel=0&vq={videoQuality === 'tiny' ? 'small' : 'hd720'}"
				title="YouTube video player"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>
		</div>

		<div class="video-controls-wrapper mb-8 mt-4">
			<div class="video-controls">
				<div class="playback-controls">
					<div class="speed-controls flex gap-2">
						{#each [0.5, 1, 1.5, 2] as speed}
							<Button
								onclick={() => setPlaybackSpeed(speed)}
								variant={playbackRate === speed ? 'default' : 'outline'}
								size="sm"
							>
								{speed}x
							</Button>
						{/each}
					</div>
				</div>

				<div class="volume-controls flex items-center justify-center">
					<Label>Volume</Label>
					<Slider bind:value={volume} max={100} step={1} class="w-full max-w-[200px]" />
					<span class="ml-2 text-sm">{volume[0]}%</span>
				</div>
			</div>
		</div>
	{/if}

	<div class="music-selection-container">
		<div class="section-header mb-4">
			<h3 class="text-lg font-medium">Background Music</h3>
			<p class="text-sm text-muted-foreground">
				Choose your background music or add a custom track
			</p>
		</div>

		<div class="grid grid-cols-2 gap-4 mb-6">
			{#each backgroundMusicList as option, index}
				<Card
					class="relative cursor-pointer hover:bg-accent transition-colors {selectedMusic?.url ===
					option.url
						? 'bg-accent'
						: ''}"
					onclick={() => {
						selectedMusic = option;
						url = option.url;
						localStorage.setItem('zimmer_bg_url', option.url);
					}}
				>
					<CardHeader class="px-4 py-3">
						<div class="flex items-start justify-between">
							<div class="space-y-0.5">
								<CardTitle class="">{option.title}</CardTitle>
								<CardDescription class="mt-1"
									><Music width={10} class="h-3 mt-1 w-3" /></CardDescription
								>
							</div>
							<div class="flex flex-col gap-2">
								<!-- {#if selectedMusic?.url === option.url}
									<Check width={12} class="h-4 w-4  text-primary" />
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
				saveToLocalStorage();
			}}
		/>
	</div>
</div>

<style>
	.video-container {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.video-wrapper {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	iframe {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.video-controls-wrapper {
		width: 100%;
	}

	.video-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.playback-controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
	}

	.speed-controls {
		display: flex;
		gap: 0.5rem;
	}

	.volume-controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	@media (max-width: 640px) {
		.video-container {
			max-width: 100%;
			padding: 0 1rem;
		}

		.playback-controls,
		.volume-controls {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
