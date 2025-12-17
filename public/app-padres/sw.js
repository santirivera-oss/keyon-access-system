// Service Worker - Keyon Padres PWA
const CACHE_NAME = 'keyon-padres-v1.0.0';
const OFFLINE_URL = '/padres/offline.html';

// Recursos para cachear
const STATIC_ASSETS = [
  '/padres/',
  '/padres/index.html',
  '/padres/manifest.json',
  '/padres/offline.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
];

// Instalar - cachear recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar - limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests que no son GET
  if (request.method !== 'GET') return;
  
  // Ignorar requests de Firebase/Analytics
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('google-analytics')) {
    return;
  }
  
  // Para navegación, usar Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear respuesta exitosa
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Sin conexión - mostrar página offline
          return caches.match(OFFLINE_URL) || caches.match(request);
        })
    );
    return;
  }
  
  // Para otros recursos, usar Cache First con Network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Actualizar cache en background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {});
          
          return cachedResponse;
        }
        
        // No está en cache, buscar en red
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);
  
  let data = {
    title: 'Keyon Padres',
    body: 'Nueva notificación',
    icon: '/padres-app/icons/icon-192.png',
    badge: '/padres-app/icons/badge-72.png',
    tag: 'keyon-notification'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/padres-app/index.html'
    },
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const url = event.notification.data?.url || '/padres-app/index.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Buscar ventana existente
        for (const client of windowClients) {
          if (client.url.includes('/padres-app/') && 'focus' in client) {
            return client.focus();
          }
        }
        // Abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sincronizar notificaciones pendientes cuando vuelva la conexión
  console.log('[SW] Sincronizando notificaciones...');
}

// Mensaje desde la app
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
