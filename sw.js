// Service worker for Skácko Playlist
// Bump CACHE_VERSION whenever you change any cached file (index.html, styles.css, app.js, icons, playlist.json)
// so returning phones pick up the update instead of serving a stale cache.
const CACHE_VERSION = "v5";
const CACHE_NAME = `skacko-playlist-${CACHE_VERSION}`;

// App shell + the goal siren are precached on install so the core app
// and the most important sound work offline right away.
const PRECACHE_URLS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "assets/playlist.json",
  "assets/gol-song.mp3",
  "icons/skb-logo-800x800x200-200x200.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isSongFile = url.pathname.includes("/assets/songs/") || url.pathname.endsWith("gol-song.mp3");

  if (isSongFile) {
    // Cache-first: once a song has been played (and cached), it plays offline next time.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // App shell: network-first so updates are picked up, falling back to cache offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
