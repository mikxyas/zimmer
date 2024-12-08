<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { isValidYoutubeUrl } from '$lib/utils/youtube';
	import { Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		addMusic: { title: string; url: string };
	}>();

	let title: string = '';
	let url: string = '';
	let open: boolean = false;
	$: isUrlValid = isValidYoutubeUrl(url);

	function handleSubmit() {
		if (title.trim() && isUrlValid) {
			dispatch('addMusic', { title: title.trim(), url });
			title = '';
			url = '';
			open = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			title = '';
			url = '';
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Trigger>
		<Button variant="outline" class="self-center "
			>Add Background Music <Plus class="ml-2" /></Button
		>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Add Background Music</Dialog.Title>
			<Dialog.Description>
				Add a new background music track. Please provide a title and a valid YouTube URL.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="title" class="text-right">Title</Label>
				<Input id="title" bind:value={title} placeholder="Enter music title" class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="url" class="text-right">URL</Label>
				<div class="col-span-3 space-y-2">
					<Input
						id="url"
						bind:value={url}
						placeholder="Enter YouTube URL"
						class={isUrlValid ? 'border-green-500' : url ? 'border-destructive' : ''}
					/>
					{#if url && !isUrlValid}
						<p class="text-xs text-destructive">Please enter a valid YouTube URL</p>
					{/if}
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit" disabled={!title.trim() || !isUrlValid} onclick={handleSubmit}>
				Save Music
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
