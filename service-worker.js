
const CACHE_NAME = "foxglove-offline-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./foxglove.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name =>
            name.startsWith("foxglove-offline-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle requests from this app's own website.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).catch(() => {
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("", {
          status: 503,
          statusText: "Offline and not cached"
        });
      });
    })
  );
});
