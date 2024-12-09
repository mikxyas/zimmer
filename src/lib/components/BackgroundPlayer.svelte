<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { extractVideoId, parseYouTubeUrl } from '$lib/utils/youtube';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import {
		CassetteTape,
		Check,
		ChevronLeft,
		ChevronRight,
		ListMusic,
		Music,
		Pause,
		Play
	} from 'lucide-svelte';
	import { Trash2 } from 'lucide-svelte';
	import AddBackgroundMusicDialog from './AddBackgroundMusicDialog.svelte';

	// Type definitions
	interface BackgroundMusic {
		title: string;
		url: string;
		isPlaylist?: boolean;
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
	let player: any;

	let videoId: string = '';
	let playlistId: string = '';
	let isPlaying: boolean = false;
	let videoInput: string = '';
	let playbackRate: number = 1;
	let volume: [number] = [50]; // Shadcn Slider uses array
	let videoQuality: 'tiny' | 'default' = 'tiny';
	let customTitle: string = '';
	let customUrl: string = '';
	let selectedMusic: BackgroundMusic | null = null;
	let isLoading: boolean = false;
	let isPlaylistMode: boolean = false;

	export function getBgPlayer() {
		if (player) {
			return player;
		}
	}

	// Get stored music from localStorage or use default
	const getStoredMusic = (): BackgroundMusic[] => {
		const storedMusic = localStorage.getItem('zimmer_background_music');
		return storedMusic
			? JSON.parse(storedMusic)
			: [
					{
						title: 'Beethoven',
						url: 'https://www.youtube.com/watch?v=W-fFHeTX70Q',
						isPlaylist: false
					},
					{
						title: 'Hans Zimmer',
						url: 'https://www.youtube.com/watch?v=IqiTJK_uzUY',
						isPlaylist: false
					},
					{
						title: 'Ethio Jazz',
						url: 'https://www.youtube.com/watch?v=GCXGjvrYcxc&list=PLT0sa3LsER_DuoCXhPlnx4lG5z77idYvR&index=9',
						isPlaylist: true
					},
					{
						title: 'Lofi Girl',
						url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
						isPlaylist: false
					},
					{
						title: 'Groovy Jazz',
						url: 'https://www.youtube.com/watch?v=vDVSGA5b05U',
						isPlaylist: false
					},
					{
						title: 'Mulatu Astatke',
						url: 'https://www.youtube.com/watch?v=5y3JU5ZMg5Y',
						isPlaylist: false
					}
				];
	};

	let backgroundMusicList = getStoredMusic();

	function setPlaybackSpeed(speed: number): void {
		if (player) {
			player.setPlaybackRate(speed);
			playbackRate = speed;
		}
	}

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

	function handleAddMusic(event: CustomEvent<BackgroundMusic>) {
		const newMusic = event.detail;
		backgroundMusicList = [...backgroundMusicList, newMusic];
		localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
	}

	async function initializePlaylistPlayer(playlistId: string) {
		try {
			if (!playlistId) return;

			isLoading = true;
			// await loadYouTubeAPI();

			if (player) {
				player.destroy();
			}

			const playerContainer = document.getElementById('background-player');
			if (!playerContainer) {
				console.error('Player container not found');
				return;
			}

			player = new window.YT.Player('background-player', {
				height: '0',
				width: '0',
				playerVars: {
					listType: 'playlist',
					list: playlistId,
					autoplay: autoplay ? 1 : 0,
					controls: 1,
					disablekb: 1,
					enablejsapi: 1,
					fs: 0,
					modestbranding: 1,
					playsinline: 1,
					rel: 0
				},
				events: {
					onReady: handlePlayerReady,
					onStateChange: handlePlayerStateChange,
					onError: handlePlayerError
				}
			});
		} catch (error) {
			console.error('Error initializing playlist player:', error);
		} finally {
			isLoading = false;
		}
	}

	async function initializePlayer(videoId: string) {
		try {
			if (!videoId) return;

			isLoading = true;
			// await loadYouTubeAPI();

			if (player) {
				player.destroy();
			}

			const playerContainer = document.getElementById('background-player');
			if (!playerContainer) {
				console.error('Player container not found');
				return;
			}

			player = new window.YT.Player('background-player', {
				height: '0',
				width: '0',
				videoId: videoId,
				playerVars: {
					autoplay: autoplay ? 1 : 0,
					controls: 1,
					disablekb: 1,
					enablejsapi: 1,
					fs: 0,
					modestbranding: 1,
					playsinline: 1,
					rel: 0
				},
				events: {
					onReady: handlePlayerReady,
					onStateChange: handlePlayerStateChange,
					onError: handlePlayerError
				}
			});
		} catch (error) {
			console.error('Error initializing player:', error);
			// dispatch('error', { type: 'initialization', error });
		} finally {
			isLoading = false;
		}
	}

	// if the music is said not to be stored as a playlist remove the videoId from the url in the dialog

	async function handleUrlChange(newUrl: string) {
		if (!newUrl) return;
		const urlInfo = parseYouTubeUrl(newUrl);
		if (urlInfo.isPlaylist) {
			console.log('bg music is playlist ');
			isPlaylistMode = true;
			await initializePlaylistPlayer(urlInfo.playlistId);
			localStorage.setItem('zimmer_bg_url', newUrl);

			videoInput = '';
			return;
		} else {
			console.log('bg music is not playlist');
			isPlaylistMode = false;
			await initializePlayer(urlInfo.videoId);
			localStorage.setItem('zimmer_bg_url', newUrl);
		}
	}

	function deleteBackgroundMusic(music: BackgroundMusic) {
		backgroundMusicList = backgroundMusicList.filter((m) => m !== music);
		localStorage.setItem('zimmer_background_music', JSON.stringify(backgroundMusicList));
	}

	function handleSelectMusic(music: BackgroundMusic) {
		selectedMusic = music;
		console.log(music);
		handleUrlChange(music.url);
	}

	// Load YouTube IFrame API
	// function loadYouTubeAPI(): Promise<void> {
	// 	return new Promise((resolve) => {
	// 		if (window.YT && window.YT.Player) {
	// 			resolve();
	// 			return;
	// 		}

	// 		const tag = document.createElement('script');
	// 		tag.src = 'https://www.youtube.com/iframe_api';

	// 		if (document.readyState === 'loading') {
	// 			document.addEventListener('DOMContentLoaded', () => {
	// 				const firstScriptTag = document.getElementsByTagName('script')[0];
	// 				firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
	// 			});
	// 		} else {
	// 			const firstScriptTag = document.getElementsByTagName('script')[0];
	// 			firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
	// 		}

	// 		window.onYouTubeIframeAPIReady = () => {
	// 			resolve();
	// 		};
	// 	});
	// }

	function handlePlayerReady(event: any) {
		console.log('YouTube player ready');
		// console.log(event);
	}

	function handlePlayerStateChange(event: any) {
		switch (event.data) {
			case window.YT.PlayerState.PLAYING:
				isPlaying = true;
				dispatch('playing', { type: 'podcast' });
				break;
			case window.YT.PlayerState.PAUSED:
				isPlaying = false;
				dispatch('pause', { type: 'podcast' });
				break;
			case window.YT.PlayerState.ENDED:
				isPlaying = false;
				break;
		}
	}

	function handlePlayerError(event: any) {
		console.error('YouTube player error:', event);
	}

	function playNextInPlaylist() {
		if (player && isPlaylistMode) {
			player.nextVideo();
		}
	}

	function playPreviousInPlaylist() {
		if (player && isPlaylistMode) {
			player.previousVideo();
		}
	}

	onMount(async () => {
		isLoading = true;
		if (url) {
			// console.log('initializing the url player');
			await handleUrlChange(url);
			isLoading = false;
		} else {
			isLoading = false;
		}
	});

	onDestroy(() => {
		if (player) {
			player.destroy();
		}
	});

	$: {
		if (url && parseYouTubeUrl(url).videoId) {
			const newVideoId = parseYouTubeUrl(url).videoId;
			if (newVideoId !== videoId) {
				videoId = newVideoId;
				initializePlayer(videoId);
			}
		}

		// Update volume when volume changes
		if (player?.setVolume) {
			player.setVolume(volume[0]);
		}
	}
</script>

<div class="video-container">
	<!-- <div class="mb-4"> -->
	<div class="video-input-wrapper">
		<form class="flex gap-2">
			<Input
				type="text"
				bind:value={videoInput}
				placeholder="YouTube video or playlist url"
				class="flex-grow"
			/>
			<Button
				onclick={() => handleUrlChange(videoInput)}
				disabled={videoInput === ''}
				variant="default"
				size="sm">Change Bg</Button
			>
		</form>
	</div>
	<!-- </div> -->

	{#if videoId}
		<div class="video-wrapper mt-4 relative bg-black/5 rounded-lg overflow-hidden">
			{#if isLoading}
				<div class="loading-overlay flex items-center justify-center">
					<div class="loading-spinner"></div>
				</div>
			{/if}
			<div id="background-player" class="video w-full aspect-video"></div>
		</div>

		<div class="video-controls-wrapper mb-8 mt-4">
			<div class="video-controls">
				<div class="playback-controls">
					<div class="flex justify-between items-center flex-col sm:flex-row">
						<div class="speed-controls flex sm:mb-0 mb-3 gap-2">
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
						{#if isPlaylistMode}
							<div class="playlist-controls flex gap-3 justify-end">
								<Button onclick={() => playPreviousInPlaylist()} variant="outline" size="icon">
									<ChevronLeft class="h-4 w-4" />
								</Button>
								<Button onclick={togglePlayPause} variant="outline" size="icon">
									{#if isPlaying}
										<Pause class="h-4 w-4" />
									{:else}
										<Play class="h-4 w-4" />
									{/if}
								</Button>
								<Button onclick={() => playNextInPlaylist()} variant="outline" size="icon">
									<ChevronRight class="h-4 w-4" />
								</Button>
							</div>
						{:else}
							<div class="playlist-controls flex gap-3 justify-end">
								<Button onclick={togglePlayPause} variant="outline" size="icon">
									{#if isPlaying}
										<Pause class="h-4 w-4" />
									{:else}
										<Play class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						{/if}
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

	<div class="music-selection-container mb-10">
		<div class="section-header mb-4">
			<h3 class="text-lg font-medium">Background Music</h3>
			<p class="text-sm text-muted-foreground">
				Choose your background music or add a custom track
			</p>
		</div>

		<div class="grid grid-cols-2 gap-4 mb-4">
			{#each backgroundMusicList as option}
				<Card
					class="relative cursor-pointer hover:bg-accent transition-colors {selectedMusic?.url ===
					option.url
						? 'bg-accent'
						: ''}"
					onclick={() => handleSelectMusic(option)}
				>
					<CardHeader class="px-4 py-3">
						<div class="flex items-start justify-between">
							<div class="space-y-0.5">
								<CardTitle class="">{option.title}</CardTitle>
								<CardDescription class="mt-1">
									{#if parseYouTubeUrl(option.url).isPlaylist}
										<ListMusic width={10} class="h-3 mt-1 w-3" />
									{:else}
										<Music width={10} class="h-3 mt-1 w-3" />
									{/if}
								</CardDescription>
							</div>
							<div class="flex flex-col gap-2">
								<!-- {#if selectedMusic?.url === option.url}
								<Check width={12} class="h-4 w-4  text-primary" />
							{/if} -->
								<button
									class="text-destructive hover:text-destructive/80 transition-colors"
									on:click|stopPropagation={() => deleteBackgroundMusic(option)}
								>
									<Trash2 width={12} class="h-4 w-4" />
								</button>
							</div>
						</div>
					</CardHeader>
				</Card>
			{/each}
		</div>

		<AddBackgroundMusicDialog on:addMusic={(event) => handleAddMusic(event)} />
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
		flex-direction: column;
		align-items: stretch;
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

	.playlist-controls {
		display: flex;
		gap: 0.5rem;
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
