const CACHE_NAME = 'glow-admin-v1';
const ASSETS_TO_CACHE = [
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// --- 1. INSTALACIÓN (Cachear recursos estáticos) ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// --- 2. ACTIVACIÓN (Limpiar cachés viejas) ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- 3. FETCH (Estrategia: Network First, fallback a Cache) ---
// Esto asegura que el admin siempre vea datos frescos, pero si no hay internet, carga la interfaz.
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET (no POST a Supabase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la red responde bien, guardamos copia en caché y retornamos
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos servir desde caché
        return caches.match(event.request);
      })
  );
});

// --- 4. NOTIFICACIONES PUSH (Tu código existente) ---
const GLOW_ICON_GRANDE = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';
const GLOW_BADGE_BLANCO = 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png';

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Glow Admin';
    const message = data.message || 'Nueva actividad';

    const options = {
        body: message,
        icon: GLOW_ICON_GRANDE,
        badge: GLOW_BADGE_BLANCO,
        vibrate: [100, 50, 100],
        data: { url: '/index.html' },
        tag: 'glow-notification',
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/index.html');
        })
    );
});
