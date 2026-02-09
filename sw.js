const CACHE_NAME = 'glow-admin-v5'; // Incrementa versión
const ASSETS_TO_CACHE = [
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

const GLOW_ICON_DEFAULT = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';
const GLOW_BADGE = 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png';

// 1. INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

// 2. ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
  )));
  self.clients.claim();
});

// 3. FETCH
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response('Offline', { status: 404 })))
  );
});

// --- 4. PUSH NOTIFICATION (CORREGIDO PARA PIPEDREAM) ---
self.addEventListener('push', function(event) {
    let payload = {};
    if (event.data) {
        try { payload = event.data.json(); } catch(e) { console.error('Error parse JSON push', e); }
    }

    const title = payload.title || 'Glow App';
    const options = {
        body: payload.message || 'Nueva actividad',
        icon: payload.image || GLOW_ICON_DEFAULT,
        badge: GLOW_BADGE,
        vibrate: [100, 50, 100],
        data: { 
            record: payload.data, // Pipedream envía 'data' con el objeto de BD
            type: payload.type    // 'mensajes' o 'reservas'
        },
        tag: 'glow-notification-' + Date.now(), // Tag único para no reemplazar notificaciones previas
        renotify: true
    };

    // 1. Mostrar la notificación visual SIEMPRE (App cerrada o background)
    const showNotificationPromise = self.registration.showNotification(title, options);

    // 2. Comunicar a la APP ABIERTA (Si está activa)
    const sendToClientPromise = self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true
    }).then((clientList) => {
        for (const client of clientList) {
            // Enviamos mensaje al frontend para actualizar UI en vivo
            client.postMessage({
                action: 'NUEVA_DATA_PUSH',
                tipo: payload.type,
                record: payload.data 
            });
        }
    });

    event.waitUntil(Promise.all([showNotificationPromise, sendToClientPromise]));
});

// --- 5. NOTIFICATION CLICK ---
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Si la app ya está abierta, enfocarla
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) return client.focus();
            }
            // Si no, abrirla
            if (self.clients.openWindow) return self.clients.openWindow('/index.html');
        })
    );
});
