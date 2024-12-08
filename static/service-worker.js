const CACHE_NAME = 'zimmer-podcast-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/podcast-icon-192.png',
  '/podcast-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.add(url);
              }
              console.warn(`Could not cache ${url}`);
              return Promise.resolve();
            }).catch(error => {
              console.warn(`Error caching ${url}:`, error);
              return Promise.resolve();
            })
          )
        );
      })
  );
  
  // Force the waiting service worker to become active
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // IMPORTANT: Clone the request. A request is a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // IMPORTANT: Clone the response. A response is a stream and can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
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
