<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { extractVideoId, isValidYoutubeUrl } from '$lib/utils/youtube';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';
	import { Card } from '$lib/components/ui/card';
	import { Check } from 'lucide-svelte';

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
			url: 'https://www.youtube.com/watch?v=5y3JU5ZMg5Y'
		}
	];

	let selectedMusic: BackgroundMusic | null = backgroundMusicOptions.find((option) => option.url === url) || null;

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
</script>

<div class="video-container">
	<div class=" mb-4">
		<div class="flex gap-2">
			<Input
				type="text"
				bind:value={videoInput}
				placeholder="Enter YouTube URL"
				class="flex-grow"
			/>
			<Button onclick={changeVideo} variant="default" size="sm">Change Background</Button>
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

		<div class="video-controls-wrapper mb-8">
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

		<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
			{#each backgroundMusicOptions as option}
				<Card
					class="p-4 cursor-pointer hover:bg-accent transition-colors relative {selectedMusic?.url ===
					option.url
						? 'border-primary bg-accent/50'
						: ''}"
					onclick={() => {
						selectedMusic = option;
						url = option.url;
					}}
				>
					<h3 class="font-medium">{option.title}</h3>
					{#if selectedMusic?.url === option.url}
						<div class="absolute top-2 right-2 text-primary">
							<Check size={16} />
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	</div>
</div>

<style>
	.video-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 640px;
		margin: 0 auto;
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
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: var(--background);
		border: 1px solid var(--border);
	}

	.video-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.playback-controls {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.volume-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.music-selection-container {
		width: 100%;
		padding: 1.5rem;
		border-radius: 0.5rem;
		background-color: var(--background);
		border: 1px solid var(--border);
	}

	.section-header {
		text-align: center;
	}

	.custom-url-section {
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}
</style>
