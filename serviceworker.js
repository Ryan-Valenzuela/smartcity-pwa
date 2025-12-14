const CACHE_NAME = 'hazardlite-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          // Optional: you can add a fallback page here for offline
          cached
        )
      );
    })
  );
});
