self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Only intercept requests for http/https, ignore chrome-extension:// etc
    if (!event.request.url.startsWith('http')) return;

    // Custom logic can be added here (e.g., caching)
    // For now, just pass through to satisfy PWA install requirement
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Offline Content Placeholder');
        })
    );
});
