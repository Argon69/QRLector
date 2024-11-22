const CACHE_NAME = 'qr-scanner-cache-v1';
const urlsToCache = [
  '/', // Página principal
  '/index.html', // Archivo HTML principal
  '/manifest.json', // Manifest para la PWA
  '/icons/icon-192x192.png', // Ícono para dispositivos
  '/icons/icon-512x512.png', // Ícono de mayor resolución
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css', // Estilos externos
  'https://unpkg.com/html5-qrcode', // Librería externa
];

// Evento 'install': Carga inicial de los recursos al caché
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando y cacheando archivos...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('[Service Worker] Error al cachear recursos:', error);
      });
    })
  );
});

// Evento 'fetch': Responde con recursos cacheados o realiza una solicitud de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el recurso está en el caché, devuélvelo; si no, solicita a la red
      return (
        cachedResponse ||
        fetch(event.request).catch((error) => {
          console.warn('[Service Worker] No se pudo obtener el recurso:', error);
        })
      );
    })
  );
});

// Evento 'activate': Limpia cachés antiguas si hay una nueva versión
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando y limpiando cachés antiguas...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
