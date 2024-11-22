const CACHE_NAME = 'qr-scanner-cache-v1';
const urlsToCache = [
  '/', 
  '/index.html', 
  '/manifest.json', 
  '/icons/qrcodescan_120401.png', 
  '/icons/qrcodescan_120401.png', 
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css', 
  'https://unpkg.com/html5-qrcode'
];

// Instala el Service Worker y agrega recursos a la caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activa el SW inmediatamente después de instalarlo
});

// Intercepta las solicitudes y responde con caché si está disponible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Si hay un recurso en caché, devuélvelo
        console.log('[Service Worker] Serving cached:', event.request.url);
        return cachedResponse;
      }
      // Si no, intenta obtenerlo de la red
      console.log('[Service Worker] Fetching from network:', event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            event.request.method === 'GET' && 
            networkResponse && 
            networkResponse.status === 200
          ) {
            // Actualiza la caché con la respuesta de la red
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
        });
    })
  );
});

// Elimina versiones antiguas de la caché cuando se activa un nuevo SW
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => 
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim(); // Activa el SW en todos los clientes inmediatamente
});
