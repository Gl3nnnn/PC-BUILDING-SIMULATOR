const VERSION = 'pcbs-v2.10.0';

// The whole app is static, so the cache list is explicit. Every entry is a
// path relative to this file, which keeps it correct when the site is served
// from a folder below the domain root (GitHub Pages uses /PC-BUILDING-SIMULATOR/).
const CORE = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.webmanifest',
  './css/styles.css',
  './css/base.css',
  './css/home.css',
  './css/builder.css',
  './css/pages.css',
  './css/performance.css',
  './css/visualizer.css',
  './css/showcase.css',
  './css/about.css',
  './css/overlays.css',
  './css/responsive.css',
  './css/workshop.css',
  './css/boot.css',
  './css/benchmark.css',
  './css/learn.css',
  './css/career.css',
  './css/data.css',
  './js/app.js',
  './js/core/achievements.js',
  './js/core/assembly.js',
  './js/core/audio.js',
  './js/core/benchmark.js',
  './js/core/boot.js',
  './js/core/build.js',
  './js/core/cables.js',
  './js/core/career.js',
  './js/core/compat.js',
  './js/core/currency.js',
  './js/core/db.js',
  './js/core/export.js',
  './js/core/format.js',
  './js/core/gameplay.js',
  './js/core/intelligence.js',
  './js/core/learn.js',
  './js/core/mode.js',
  './js/core/perf.js',
  './js/core/poster.js',
  './js/core/prices.js',
  './js/core/settings.js',
  './js/core/store.js',
  './js/core/thermal.js',
  './js/data/component-specs.js',
  './js/data/hardware.js',
  './js/data/hardware-more.js',
  './js/data/jobs.js',
  './js/data/lessons.js',
  './js/data/presets.js',
  './js/data/repairs.js',
  './js/pages/about.js',
  './js/pages/benchmark.js',
  './js/pages/boot.js',
  './js/pages/builder.js',
  './js/pages/career.js',
  './js/pages/compatibility.js',
  './js/pages/data.js',
  './js/pages/database.js',
  './js/pages/home.js',
  './js/pages/learn.js',
  './js/pages/performance.js',
  './js/pages/repair.js',
  './js/pages/saved.js',
  './js/pages/showcase.js',
  './js/pages/visualizer.js',
  './js/pages/workshop.js',
  './js/three/scene.js',
  './js/three/brands.js',
  './js/three/rig/camera.js',
  './js/three/rig/surfaces.js',
  './js/three/rig/fan.js',
  './js/three/rig/export-glb.js',
  './js/three/rig/parts/index.js',
  './js/three/rig/parts/case.js',
  './js/three/rig/parts/motherboard.js',
  './js/three/rig/parts/cooling.js',
  './js/three/rig/parts/memory.js',
  './js/three/rig/parts/gpu.js',
  './js/three/rig/parts/power.js',
  './js/three/rig/parts/fans.js',
  './js/ui/art.js',
  './js/ui/command.js',
  './js/ui/common.js',
  './js/ui/compare.js',
  './js/ui/icons.js',
  './js/ui/modal.js',
  './js/ui/modebar.js',
  './js/ui/preset.js',
  './js/ui/product.js',
  './js/ui/specs.js',
  './js/ui/summary.js',
  './js/ui/toast.js',
  './js/ui/tutorial.js',
  './js/ui/wizard.js',
  './js/ui/workbench.js',
  './vendor/three.module.min.js',
  './data/prices.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // One stale entry must not be allowed to abort the whole install, so each
      // file is cached on its own and a failure is only logged.
      .then((cache) => Promise.all(CORE.map((path) => cache.add(path).catch((error) => {
        console.warn(`Offline cache skipped ${path}`, error);
      }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Everything below is compared against a path relative to the service worker's
// scope. On GitHub Pages the scope is /PC-BUILDING-SIMULATOR/, so an absolute
// "/js/" test would never match.
function relativePath(url) {
  const scope = new URL(self.registration.scope);
  if (url.pathname.startsWith(scope.pathname)) {
    return url.pathname.slice(scope.pathname.length);
  }
  return url.pathname.replace(/^\//, '');
}

function cacheKey(request) {
  return request;
}

function store(request, response) {
  if (!response || !response.ok) return response;
  const copy = response.clone();
  caches.open(VERSION).then((cache) => cache.put(cacheKey(request), copy));
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => store(request, response))
    .catch(() => caches.match(request).then((cached) => {
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    }));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => store(request, response));
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = relativePath(url);
  const networkFirstRequest = request.mode === 'navigate'
    || ['document', 'script', 'style'].includes(request.destination)
    || path.endsWith('data/prices.json')
    || path.startsWith('js/')
    || path.startsWith('css/');
  event.respondWith(networkFirstRequest ? networkFirst(request) : cacheFirst(request));
});
