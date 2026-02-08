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
self.addEventListener('push', function(event) {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        console.error('Error parseando push data', e);
        return;
    }

    // A. ENVIAR A CLIENTE (Para actualizar la UI en tiempo real)
    const updateClientsPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
            clientList.forEach(client => {
                client.postMessage({
                    action: 'UPDATE_DATOS', 
                    tipo: data.type,   // 'mensajes' o 'reservas'
                    payload: data.data // El registro completo
                });
            });
        });

    // B. MOSTRAR NOTIFICACIÓN VISUAL
    const title = data.title || 'Glow Admin';
    const options = {
        body: data.message || 'Tienes una nueva notificación',
        icon: data.image || GLOW_ICON_DEFAULT, // Usa la foto del cliente si Pipedream la envió
        badge: GLOW_BADGE,
        vibrate: [100, 50, 100],
        data: { url: '/index.html' }, // Guardamos la URL para el click
        tag: data.type === 'mensajes' ? 'msg-group' : 'booking-group', // Agrupar por tipo
        renotify: true,
        actions: [
            { action: 'open', title: 'Ver ahora' }
        ]
    };

    const showNotificationPromise = self.registration.showNotification(title, options);

    // Ejecutar ambas cosas en paralelo (más rápido y seguro)
    event.waitUntil(Promise.all([updateClientsPromise, showNotificationPromise]));
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
