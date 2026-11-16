/*
 * ChemCurious service worker (v2).
 *
 * Goal: never show an outdated UI after a deploy, and never store private data.
 *
 *  - Pages (navigations):        network only. If the network is down, show /offline.html.
 *                                HTML is never cached, so a new deploy is visible on the next load.
 *  - /_next/static/* (hashed):   cache first. File names change on every build, so a cached
 *                                file can never be stale.
 *  - Other same-origin assets    network first, cached copy only as an offline fallback.
 *    (images, icons, fonts, /data/*)
 *  - Everything else:            not handled at all, so the browser does its normal thing.
 *    This includes /api/* (often per-user and authenticated), /admin, Next.js RSC data
 *    (client-side navigation payloads), cross-origin requests, and non-GET requests.
 */

const VERSION = "v2";
const CACHE_NAME = `chemcurious-${VERSION}`; // offline page + shell icons
const STATIC_CACHE = `chemcurious-static-${VERSION}`; // hashed Next.js build files
const ASSET_CACHE = `chemcurious-assets-${VERSION}`; // images, fonts, data files
const CURRENT_CACHES = [CACHE_NAME, STATIC_CACHE, ASSET_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/ChemCurious_logo.svg"];

/** Upper bounds so runtime caches can't grow without limit. */
const MAX_STATIC_ENTRIES = 300;
const MAX_ASSET_ENTRIES = 150;

const ASSET_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn("[ChemCurious SW] Precache warning:", err))
      // Activate the new worker immediately instead of waiting for every tab to close.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete every cache from older versions (including "chemcurious-v1", which held
      // cached HTML and API responses).
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n)));
      // Navigation preload lets the browser start the page request while the worker boots.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin: leave to the browser
  if (request.headers.has("range")) return; // partial (media) requests

  const path = url.pathname;
  if (path.startsWith("/api/") || path.startsWith("/admin") || path === "/sw.js") return;
  // Next.js App Router data for client-side navigations: always live.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkOnlyPage(event));
    return;
  }

  if (path.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC_ENTRIES));
    return;
  }

  if (path.startsWith("/data/") || ASSET_EXTENSIONS.test(path)) {
    event.respondWith(networkFirst(request, ASSET_CACHE, MAX_ASSET_ENTRIES));
  }
  // Anything else falls through to the network untouched.
});

/** Pages are never cached; the offline page is the only fallback. */
async function networkOnlyPage(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    trimCache(cacheName, maxEntries);
  }
  return response;
}

async function networkFirst(request, cacheName, maxEntries) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

/** Only complete, same-origin, publicly cacheable responses are stored. */
function isCacheable(response) {
  if (!response || response.status !== 200 || response.type !== "basic") return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store|private/i.test(cacheControl);
}

/** Drop the oldest entries (Cache keys are kept in insertion order). */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}
