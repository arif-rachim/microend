const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache([
            "/",
            "/index.html"
        ])
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(cacheFirst(event.request));
});
const putInCache = async (request, response) => {
    if (!request.url.startsWith('http')) {
        return;
    }
    const cache = await caches.open("v1");
    await cache.put(request, response);
};

const cacheFirst = async (request) => {
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone()).then();
    return responseFromNetwork;
};