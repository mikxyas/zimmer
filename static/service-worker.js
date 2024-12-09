// Minimal service worker that doesn't cache anything
self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Clean up any old caches
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => caches.delete(cacheName))
			);
		})
	);
	self.clients.claim();
});

// Background audio handling
self.addEventListener('message', (event) => {
	if (event.data.type === 'PLAY_AUDIO') {
		self.registration.showNotification('Podcast Playing', {
			body: event.data.title,
			icon: '/podcast-icon-192.png'
		});
	}
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
	console.log('App installed successfully');
});
