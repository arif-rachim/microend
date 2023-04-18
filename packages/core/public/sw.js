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

const cacheFirst = (request) => {
    let isResolved = false;
    return new Promise(resolve => {
        fetch(request).then(responseFromNetwork => {
            putInCache(request, responseFromNetwork.clone()).then(() => {
                if(!isResolved){
                    resolve(responseFromNetwork);
                    isResolved = true
                }
            });
        })
        caches.match(request).then(responseFromCache => {
            if(responseFromCache && !isResolved){
                resolve(responseFromCache);
                isResolved = true;
            }
        })
    })

};