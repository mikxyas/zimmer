<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { isValidYoutubeUrl, parseYouTubeUrl } from '$lib/utils/youtube';
	import { Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		addMusic: { title: string; url: string; isPlaylist: boolean };
	}>();

	let title: string = '';
	let url: string = '';
	let forcePlaylist: boolean = false;
	let open: boolean = false;
	$: urlInfo = url ? parseYouTubeUrl(url) : null;
	$: isUrlValid = isValidYoutubeUrl(url);
	$: showPlaylistOption = urlInfo?.isPlaylist || false;

	function getUrlWithFirstParam(url: string): string {
		const urlParts = url.split('?');
		if (urlParts.length < 2) {
			return url; // No query parameters in the URL, return as-is
		}

		const queryParams = urlParts[1].split('&'); // Split the query string into key-value pairs
		const firstParam = queryParams[0]; // Get the first parameter
		return `${urlParts[0]}?${firstParam}`; // Reconstruct the URL with only the first parameter
	}

	function removeOrKeepPlaylistParam(url: string, isPlaylist: boolean) {
		if (isPlaylist) {
			return url;
		} else {
			return getUrlWithFirstParam(url);
		}
	}

	function handleSubmit() {
		if (title.trim() && isUrlValid) {
			// check if the url is a playlist and if it has a playlist id but the isplaylist is not checked remove the list= parameter from the url
			dispatch('addMusic', {
				title: title.trim(),
				url: removeOrKeepPlaylistParam(url, showPlaylistOption && forcePlaylist),
				isPlaylist: showPlaylistOption && forcePlaylist
			});
			title = '';
			url = '';
			forcePlaylist = false;
			open = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			title = '';
			url = '';
			forcePlaylist = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Trigger>
		<Button variant="outline" class="self-center mb-10"
			>Add Background Music <Plus class="ml-2" /></Button
		>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px] ">
		<Dialog.Header>
			<Dialog.Title>Add Background Music</Dialog.Title>
			<Dialog.Description>Add your favorite background music to listen to</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right" for="title">Title</Label>
				<Input id="title" bind:value={title} class="col-span-3" placeholder="Title for Music" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right" for="url">URL</Label>
				<Input
					id="url"
					bind:value={url}
					class="col-span-3"
					placeholder="YouTube video or playlist url"
				/>
			</div>
			{#if showPlaylistOption}
				<div class="grid grid-cols-4 items-center gap-4">
					<label class="flex items-center gap-2 col-span-3">
						<input type="checkbox" bind:checked={forcePlaylist} />
						<span>Play as playlist</span>
					</label>
				</div>
			{/if}
			{#if url && !isUrlValid}
				<p class="text-xs text-destructive">Please enter a valid YouTube URL</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Button type="submit" disabled={!title.trim() || !isUrlValid} onclick={handleSubmit}>
				Save Music
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
