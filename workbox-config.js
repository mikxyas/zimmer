module.exports = {
  globDirectory: '.svelte-kit/output/client/',
  globPatterns: [
    '**/*.{html,json,js,css,svg,png,ico,txt}'
  ],
  swDest: '.svelte-kit/output/client/service-worker.js',
  clientsClaim: true,
  skipWaiting: true,
  // Don't cache Google Fonts and other dynamic resources
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/www\.youtube\.com\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'youtube-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      // Cache other dynamic content
      urlPattern: /\.(js|css|json)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'dynamic-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    }
  ]
};
