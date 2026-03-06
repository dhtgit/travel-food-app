// Service Worker for Your Travel Food Companion PWA
const CACHE = 'food-companion-v1';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve shell from cache, pass Google Maps/Places API through network
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go to network for Google APIs (maps, places)
  if (url.includes('maps.googleapis.com') || url.includes('maps.gstatic.com')) {
    return; // let browser handle it
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Cache same-origin requests
        if (e.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
