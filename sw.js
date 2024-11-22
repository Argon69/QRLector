const CACHE_NAME = 'qr-scanner-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/qrcodescan_120401.png', // Mantén las rutas únicas
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://unpkg.com/html5-qrcode',
];

// Instalar el trabajador de servicio y almacenar en caché archivos necesarios
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Archivos cacheados');
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.error('[Service Worker] Error al cachear archivos:', error);
    })
  );
});

// Interceptar solicitudes y responder desde la caché o la red
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch request para:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[Service Worker] Encontrado en caché:', event.request.url);
        return response;
      }
      console.log('[Service Worker] No encontrado en caché, buscando en red:', event.request.url);
      return fetch(event.request).catch((error) => {
        console.error('[Service Worker] Error de red para:', event.request.url, error);
        // Opcional: puedes devolver una página de error personalizada
      });
    })
  );
});

// Activar el trabajador de servicio y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando y limpiando cachés antiguas...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// ** Sincronización en Segundo Plano (Background Sync) **
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-qr-scans') {
    event.waitUntil(syncQRCodes()); // Define tu lógica aquí
  }
});

async function syncQRCodes() {
  console.log('[Service Worker] Sincronizando datos QR...');
  // Implementa lógica para sincronizar datos QR
}

// ** Notificaciones Push **
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificación push recibida');
  const options = {
    body: event.data ? event.data.text() : '¡Nueva notificación!',
    icon: '/icons/qrcodescan_120401.png',
    badge: '/icons/qrcodescan_120401.png',
  };
  event.waitUntil(self.registration.showNotification('QR Scanner App', options));
});
