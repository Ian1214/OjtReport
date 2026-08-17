const CACHE = 'ojt-report-static-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || request.mode === 'navigate') return;
    if (!url.pathname.startsWith('/build/') && !url.pathname.endsWith('.png')) return;
    event.respondWith(caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; });
        return cached ?? network;
    }));
});
