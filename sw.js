const CACHE_NAME = 'glow-admin-v3'; // Incrementé la versión para refrescar
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
            console.log('Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- 3. FETCH (Estrategia: Network First, fallback a Cache, fallback a Placeholder) ---
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
            return response;
        }
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(event.request, resClone); } catch (err) {}
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Fallbacks
            if (event.request.headers.get('accept').includes('image')) {
                return new Response(
                    '<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#888">Offline</text></svg>',
                    { headers: { 'Content-Type': 'image/svg+xml' } }
                );
            }
            if (event.request.headers.get('accept').includes('text/html')) {
                 return caches.match('/index.html');
            }
            return new Response('Offline', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});

// --- 4. NOTIFICACIONES PUSH & ACTUALIZACIÓN UI (CON LÓGICA DE FOTO) ---
const GLOW_ICON_GRANDE = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';
const GLOW_BADGE_BLANCO = 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png';

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    // 1. Enviar datos a la app abierta (para que se actualice la lista sin recargar)
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            clientList.forEach(client => {
                client.postMessage({
                    action: 'UPDATE_DATOS', 
                    tipo: data.type,        
                    payload: data.data      
                });
            });

            // 2. Mostrar la notificación
            // AQUÍ ESTÁ EL CAMBIO CLAVE: Usamos data.image si existe
            const title = data.title || 'Glow Admin';
            
            // Si Pipedream envió una imagen (foto del cliente), la usamos como icono
            const iconToSend = data.image ? data.image : GLOW_ICON_GRANDE;
            
            const options = {
                body: data.message || 'Nueva actividad',
                icon: iconToSend,      // <-- Foto del cliente o Logo por defecto
                badge: GLOW_BADGE_BLANCO,
                vibrate: [100, 50, 100],
                data: { url: '/index.html' },
                tag: 'glow-notification', 
                renotify: true,
                actions: [
                    { action: 'open', title: 'Ver Detalles' }
                ]
            };

            return self.registration.showNotification(title, options);
        })
    );
});

// Al hacer click en la notificación, abrir la app
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Si ya está abierta, enfocarla
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('/index.html');
            }
        })
    );
});
