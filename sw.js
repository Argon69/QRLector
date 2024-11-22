importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "qr-scanner-cache-v1";
const OFFLINE_PAGE = "offline.html"; // La página de fallback cuando el usuario está offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/qrcodescan_120401.png',
  '/icons/qrcodescan_120401.png',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://unpkg.com/html5-qrcode',
];

// Instalar el Service Worker y añadir los archivos a la caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(urlsToCache).then(() => {
        return cache.add(OFFLINE_PAGE); // Añadir la página offline a la caché
      });
    })
  );
});

// Activar el Service Worker y gestionar la actualización de la caché
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Fetch: Manejo de la red y la caché, fallback a la página offline si no hay conexión
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si la solicitud está en caché, la devuelve
      if (response) {
        return response;
      }
      
      // Si la solicitud no está en caché, intentar obtenerla de la red
      return fetch(event.request).catch(() => {
        // Si falla la red, devolver la página offline
        return caches.match(OFFLINE_PAGE);
      });
    })
  );
});

// Permitir la sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí puedes agregar la lógica que deseas ejecutar en segundo plano cuando se recupere la conexión
      // Este es solo un ejemplo, puedes colocar cualquier tarea que desees sincronizar
      fetch('/sync-endpoint').then((response) => {
        return response.json();
      }).then((data) => {
        console.log('Sincronización en segundo plano exitosa:', data);
      }).catch((error) => {
        console.error('Error durante la sincronización:', error);
      })
    );
  }
});

// Enviar un mensaje para hacer que el Service Worker salte a la nueva versión
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Preload de navegación (mejora la carga de la primera página)
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}
