/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Check if we're in development mode
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const ASSETS = `_app/immutable/`;
const version = new Date().toISOString().slice(0, 10); // Use date-based versioning
const CACHE_NAME = `cache-${version}`;

const STATIC_ASSETS = [
    '/',
    '/favicon.png',
    '/podcast-icon-192.png',
    '/podcast-icon-512.png'
];

sw.addEventListener('install', (event) => {
    if (isDev) {
        // Skip caching in development mode
        return;
    }
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

sw.addEventListener('activate', (event) => {
    if (isDev) {
        // Clear all caches in development mode
        event.waitUntil(
            caches.keys().then(async (keys) => {
                for (const key of keys) {
                    await caches.delete(key);
                }
            })
        );
        return;
    }

    event.waitUntil(
        caches.keys().then(async (keys) => {
            for (const key of keys) {
                if (key !== CACHE_NAME) await caches.delete(key);
            }
        })
    );
});

sw.addEventListener('fetch', (event) => {
    if (isDev) {
        // Bypass cache in development mode
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.method !== 'GET') return;

    event.respondWith(
        (async () => {
            const url = new URL(event.request.url);
            const cache = await caches.open(CACHE_NAME);

            try {
                // Try network first for HTML and JSON requests
                if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
                    const response = await fetch(event.request);
                    if (response.ok) {
                        cache.put(event.request, response.clone());
                        return response;
                    }
                    return cache.match(event.request);
                }

                // For other requests, check cache first
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                const response = await fetch(event.request);
                if (response.ok) {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;
                throw error;
            }
        })()
    );
});

sw.addEventListener('message', (event) => {
    if (event.data.type === 'PLAY_AUDIO') {
        // Implement background audio notification logic
        sw.registration.showNotification('Audio Playing', {
            body: event.data.title || 'Background Audio',
            icon: '/podcast-icon-192.png'
        });
    }
});
