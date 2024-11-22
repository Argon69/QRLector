const CACHE_NAME = 'qr-scanner-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/qrcodescan_120401.png',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://unpkg.com/html5-qrcode',
];

// Instalar el Service Worker y cachear recursos iniciales
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Archivos cacheados');
      return cache.addAll(urlsToCache);
    }).catch((error) => console.error('[Service Worker] Error al cachear:', error))
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Interceptando fetch:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch((error) => {
        console.error('[Service Worker] Error de red:', error);
        // Retornar una respuesta predeterminada si es necesario
      });
    })
  );
});

// Sincronización de Fondo (Background Sync)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Evento de sincronización:', event.tag);
  if (event.tag === 'sync-qr-scans') {
    event.waitUntil(syncPendingScans());
  }
});

// Función para manejar la sincronización de datos
async function syncPendingScans() {
  console.log('[Service Worker] Sincronizando datos QR pendientes...');
  try {
    const pendingScans = await getPendingScans(); // Obtener datos pendientes
    for (const scan of pendingScans) {
      await sendScanToServer(scan); // Enviar cada dato al servidor
    }
    console.log('[Service Worker] Datos sincronizados con éxito');
  } catch (error) {
    console.error('[Service Worker] Error al sincronizar datos:', error);
  }
}

// Funciones auxiliares (deben implementarse según tu lógica)
async function getPendingScans() {
  // Lógica para recuperar datos pendientes desde IndexedDB u otro almacenamiento local
  return []; // Ejemplo: devuelve una lista vacía
}

async function sendScanToServer(scan) {
  // Lógica para enviar un dato al servidor mediante fetch o una API
  console.log('[Service Worker] Enviando dato:', scan);
  return fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(scan),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
