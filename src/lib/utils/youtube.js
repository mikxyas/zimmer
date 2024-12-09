// Shared YouTube API loading mechanism
let apiLoadPromise = null;

export function loadYouTubeAPI() {
	if (apiLoadPromise) {
		return apiLoadPromise;
	}

	apiLoadPromise = new Promise((resolve) => {
		if (window.YT) {
			resolve(window.YT);
			return;
		}

		// Create script only if it doesn't exist
		if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}

		// Set up global callback
		window.onYouTubeIframeAPIReady = () => {
			resolve(window.YT);
		};
	});

	return apiLoadPromise;
}

export function extractVideoId(url) {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/
	);
	return match ? match[1] : '';
}

export function isValidYoutubeUrl(url) {
	const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
	// console.log(youtubeRegex.test(url));
	return youtubeRegex.test(url);
}

export function extractPlaylistId(url) {
	const match = url.match(/[&?]list=([^&]+)/i);
	return match ? match[1] : '';
}

export function isPlaylist(url) {
	return !!extractPlaylistId(url);
}

export function parseYouTubeUrl(url) {
	return {
		videoId: extractVideoId(url),
		playlistId: extractPlaylistId(url),
		isPlaylist: isPlaylist(url)
	};
}
