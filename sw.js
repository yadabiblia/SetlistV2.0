const CACHE_NAME = 'setlist-atril-v1';
const STATIC_ASSETS = [
    './',
    './index.html'
];

const EXTERNAL_ORIGINS = [
    'cdn.tailwindcss.com',
    'cdnjs.cloudflare.com',
    'www.gstatic.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isTrustedCdn = EXTERNAL_ORIGINS.some((host) => url.hostname.includes(host));

    if (!isSameOrigin && !isTrustedCdn) return;

    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            const networkFetch = fetch(req)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            if (req.mode === 'navigate') {
                return networkFetch.then((res) => res || cachedResponse);
            }
            return cachedResponse || networkFetch;
        })
    );
});
