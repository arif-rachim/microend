self.addEventListener('install', event => {
    console.log('[ServiceWorker]', 'installed');
});

self.addEventListener('activate', event => {
    console.log('[ServiceWorker]', 'activate');
});
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request))
});