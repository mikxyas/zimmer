<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { extractVideoId, isValidYoutubeUrl } from '$lib/utils/youtube';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';

	// Props with type definitions
	export let url: string = '';
	export let autoplay: boolean = false;
	export let initialTime: number = 0;

	// Event dispatcher with type definitions
	const dispatch = createEventDispatcher<{
		error: { type: string; error: string };
		playing: { type: string };
		pause: { type: string };
	}>();

	// Component state with type definitions
	let iframeElement: HTMLIFrameElement;
	let player: any;
	let videoId: string = '';
	let isPlaying: boolean = false;
	let videoInput: string = '';
	let playbackRate: number = 1;
	let volume: [number] = [50]; // Shadcn Slider uses array
	let videoQuality: 'default' | 'small' | 'tiny' = 'default';
	let currentTime: number = 0;
	let saveTimeInterval: ReturnType<typeof setInterval>;
	let isLoading: boolean = false;
	let lastSavedTime = 0;
	let timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
	let seekInProgress = false;

	// Load YouTube IFrame API
	function loadYouTubeAPI(): Promise<void> {
		return new Promise((resolve) => {
			if (window.YT && window.YT.Player) {
				resolve();
				return;
			}

			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			const firstScriptTag = document.getElementsByTagName('script')[0];
			if (!firstScriptTag.parentNode) return;
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			window.onYouTubeIframeAPIReady = () => {
				resolve();
			};
		});
	}

	// Initialize YouTube player
	async function initPlayer() {
		try {
			await loadYouTubeAPI();
			console.log('YouTube API loaded');

			if (player) {
				player.destroy();
			}

			console.log('Creating player with videoId:', videoId);
			player = new window.YT.Player('youtube-player', {
				videoId,
				playerVars: {
					autoplay: autoplay ? 1 : 0,
					controls: 1,
					modestbranding: 1,
					rel: 0,
					vq: videoQuality === 'tiny' ? 'small' : 'hd720'
				},
				events: {
					onReady: onPlayerReady,
					onStateChange: onPlayerStateChange,
					onError: (e: any) => {
						console.error('YouTube player error:', e);
						isLoading = false;
						dispatch('error', { type: 'podcast', error: 'Failed to load video' });
					}
				}
			});
		} catch (error) {
			console.error('Error initializing YouTube player:', error);
			isLoading = false;
			dispatch('error', { type: 'podcast', error: 'Failed to initialize YouTube player' });
		}
	}

	function onPlayerReady(event: any) {
		console.log('Player ready');
		try {
			if (initialTime > 0) {
				event.target.seekTo(initialTime, true);
			}
			event.target.setVolume(volume[0]);
			isLoading = false;
		} catch (error) {
			console.error('Error in onPlayerReady:', error);
			isLoading = false;
		}
	}

	function onPlayerStateChange(event: any) {
		switch (event.data) {
			case window.YT.PlayerState.PLAYING:
				isPlaying = true;
				startTimeTracking();
				dispatch('playing', { type: 'podcast' });
				break;
			case window.YT.PlayerState.PAUSED:
				isPlaying = false;
				stopTimeTracking();
				saveCurrentTime(Math.floor(player.getCurrentTime()));
				dispatch('pause', { type: 'podcast' });
				break;
			case window.YT.PlayerState.ENDED:
				isPlaying = false;
				stopTimeTracking();
				saveCurrentTime(0);
				break;
		}
	}

	function startTimeTracking() {
		if (timeUpdateInterval) {
			clearInterval(timeUpdateInterval);
		}

		timeUpdateInterval = setInterval(() => {
			if (player && !seekInProgress) {
				const currentTime = Math.floor(player.getCurrentTime());
				if (Math.abs(currentTime - lastSavedTime) >= 1) {
					saveCurrentTime(currentTime);
					lastSavedTime = currentTime;
				}
			}
		}, 5000);
	}

	function stopTimeTracking() {
		if (timeUpdateInterval) {
			clearInterval(timeUpdateInterval);
			timeUpdateInterval = null;
		}
	}

	function saveCurrentTime(time: any) {
		if (!isNaN(time) && time > 0) {
			console.log('Time saved at:', time);
			localStorage.setItem('zimmer_current_time', time.toString());
		}
	}

	function handleSeek(event: any) {
		seekInProgress = true;
		const newTime = event.detail;
		if (player && player.seekTo) {
			player.seekTo(newTime, true);
			saveCurrentTime(newTime);
			lastSavedTime = newTime;
		}
		setTimeout(() => {
			seekInProgress = false;
		}, 1000);
	}

	async function handleUrlChange() {
		if (videoInput && isValidYoutubeUrl(videoInput)) {
			// Save the new URL to localStorage
			localStorage.setItem('zimmer_podcast_url', videoInput);
			console.log('Podcast URL saved:', videoInput);
			// Update the URL and reset video
			url = videoInput;
			videoId = extractVideoId(videoInput);
			currentTime = 0;
			lastSavedTime = 0;
			localStorage.setItem('zimmer_current_time', '0');

			// Reinitialize the player with the new URL
			await initPlayer();
			videoInput = '';
		} else {
			dispatch('error', { type: 'invalid_url', error: 'Invalid YouTube URL' });
		}
	}

	// @ts-ignore
	onMount(async () => {
		isLoading = true;
		if (url && isValidYoutubeUrl(url)) {
			videoId = extractVideoId(url);
			await initPlayer();
			startTimeTracking();
		} else {
			isLoading = false;
		}

		return () => {
			if (saveTimeInterval) {
				clearInterval(saveTimeInterval);
			}
			if (player) {
				try {
					// Save final position before unmounting
					currentTime = Math.floor(player.getCurrentTime());
					localStorage.setItem('zimmer_current_time', currentTime.toString());
				} catch (error) {
					console.error('Error saving final position:', error);
				}
			}
		};
	});

	onDestroy(() => {
		stopTimeTracking();
		if (player) {
			saveCurrentTime(Math.floor(player.getCurrentTime()));
			player.destroy();
		}
	});

	// Player control functions with type definitions
	function play(): void {
		if (player) {
			player.playVideo();
		}
	}

	function pause(): void {
		if (player) {
			player.pauseVideo();
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
		if (player) {
			player.setPlaybackRate(speed);
			playbackRate = speed;
		}
	}

	// Reactive statement to handle URL changes and volume updates
	$: {
		if (url && isValidYoutubeUrl(url)) {
			const newVideoId = extractVideoId(url);
			if (newVideoId !== videoId) {
				videoId = newVideoId;
				initPlayer();
			}
		}

		// Update volume when volume changes
		if (player?.setVolume) {
			player.setVolume(volume[0]);
		}
	}
</script>

<div class="video-container">
	<div class="space-y-4">
		<div class="video-input-wrapper">
			<form class="flex gap-2">
				<Input
					type="text"
					bind:value={videoInput}
					placeholder="Enter YouTube URL"
					class="flex-grow"
				/>
				<Button onclick={handleUrlChange} variant="default" size="sm">Change Podcast</Button>
			</form>
		</div>

		{#if videoId}
			<div class="video-wrapper relative bg-black/5 rounded-lg overflow-hidden">
				{#if isLoading}
					<div class="loading-overlay flex items-center justify-center">
						<div class="loading-spinner" />
					</div>
				{/if}
				<div id="youtube-player" class="aspect-video video w-full"></div>
			</div>

			<div class="video-controls-wrapper">
				<div class="video-controls">
					<div class="playback-controls">
						<div class="speed-controls">
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
						<!-- 
						<Button onclick={toggleLowQuality} variant="outline" size="sm">
							{videoQuality === 'tiny' ? 'High Quality' : 'Low Quality'}
						</Button> -->
					</div>

					<div class="volume-controls">
						<Label>Volume</Label>
						<Slider bind:value={volume} max={100} step={1} class="w-full max-w-[200px]" />
						<span class="ml-2 text-sm">{volume[0]}%</span>
					</div>
				</div>
			</div>
		{/if}
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

	.video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* .video-wrapper {
		position: relative;
		width: 100%;
		background: var(--background);
		border-radius: 0.5rem;
	} */

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--background);
		z-index: 10;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--border);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.video-input-wrapper {
		width: 100%;
	}

	.video-input-group {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	/* iframe {
		width: 100%;
		height: 100%;
		object-fit: contain;
	} */

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
