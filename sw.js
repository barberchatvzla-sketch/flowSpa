const CACHE_NAME = 'glow-admin-v4'; // Versión actualizada
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 2. ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
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
      .catch(() => caches.match(event.request).then((cached) => {
        return cached || new Response('Offline', { status: 404 });
      }))
  );
});

// --- 4. PUSH NOTIFICATION (Lógica mejorada) ---
// EN TU ARCHIVO sw.js

self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
        try { data = event.data.json(); } catch(e) { console.error('Error parse JSON push', e); }
    }

    const title = data.title || 'Glow App';
    const options = {
        body: data.message || 'Nueva actividad',
        icon: data.image || GLOW_ICON_DEFAULT, // Usa la foto que mandó Pipedream
        badge: GLOW_BADGE,
        vibrate: [100, 50, 100],
        data: { 
            url: '/index.html',
            payload: data.data, // El registro completo de la base de datos
            type: data.type     // 'mensajes' o 'reservas'
        },
        tag: 'glow-notification',
        renotify: true
    };

    // 1. Mostrar la notificación visual (Lo que ya hacías)
    const showNotificationPromise = self.registration.showNotification(title, options);

    // 2. NUEVO: Enviar mensaje a la página abierta (index.html o spa.html)
    const sendToClientPromise = self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true
    }).then((clientList) => {
        for (const client of clientList) {
            // Le enviamos los datos a la pestaña
            client.postMessage({
                action: 'NUEVA_DATA_PUSH',
                tipo: data.type,
                record: data.data // El registro de supabase que vino por Pipedream
            });
        }
    });

    event.waitUntil(Promise.all([showNotificationPromise, sendToClientPromise]));
});

// --- 5. NOTIFICATION CLICK ---
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Si hay una acción específica (ej. botones), manéjala aquí
    if (event.action === 'close') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // 1. Si la app ya está abierta, enfocarla
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. Si no, abrirla
            if (self.clients.openWindow) {
                return self.clients.openWindow('/index.html');
            }
        })
    );
});

