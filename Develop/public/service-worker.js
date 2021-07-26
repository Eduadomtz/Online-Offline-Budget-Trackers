const FILES_TO_CACHE = [
    "/",
    "/db.js",
    "/index.js",
    "/manifest.json",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
]

const STATIC_CACHE = "static-cache-v2";
const DATA_CACHE = "data-cache-v1";

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => {
                console.log("Files cached");
                return cache.addAll(FILES_TO_CACHE);
            }));
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(key => {
                        if (key !== STATIC_CACHE && key !== DATA_CACHE) {
                            console.log("Removing data", key);
                            return caches.delete(key);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches.open(DATA_CACHE).then(cache => {
                return fetch(event.request).then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                })
                    .catch(err => {
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );
        return;
    }

    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.match(event.request).then(function (response) {
                if (response) {
                    return response;
                } else if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/");
                }
            });
        })
    );
});


