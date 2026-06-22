// Service Worker - Test SPEIS
// Cambia el numero de version (v1, v2...) cada vez que actualices la app
const CACHE = 'speis-test-v8';

// Archivos locales que SIEMPRE se guardan al instalar
const APP_SHELL = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png',
  'icon-512-maskable.png'
];

// Instalacion: guarda el app shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activacion: limpia caches antiguas
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Peticiones: primero red, y si falla, lo guardado en cache
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Guarda una copia de lo que se descarga (incluida la CDN de Tailwind)
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function () {
        // Sin conexion: devuelve lo guardado
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('index.html');
        });
      })
  );
});
