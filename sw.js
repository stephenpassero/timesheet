var CACHE = 'timesheet-v1';
var ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var network = fetch(e.request).then(function (res) {
    if (!res.ok) return res;
    var copy = res.clone();
    return caches.open(CACHE)
      .then(function (c) { return c.put(e.request, copy); })
      .then(function () { return res; });
  });
  e.waitUntil(network.catch(function () {}));
  e.respondWith(caches.match(e.request).then(function (hit) { return hit || network; }));
});
