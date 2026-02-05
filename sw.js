const CACHE_NAME = 'glow-admin-v2'; // Incrementé la versión para forzar actualización
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
  // Solo interceptamos peticiones GET (no POST a Supabase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la red responde bien, guardamos copia en caché y retornamos
        // Validamos que la respuesta sea válida antes de cachear
        if (!response || response.status !== 200 || response.type === 'error') {
            return response;
        }

        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
            try {
                cache.put(event.request, resClone);
            } catch (err) {
                // Ignoramos errores de quota o scheme no soportado (ej. chrome-extension://)
            }
        });
        return response;
      })
      .catch(() => {
        // Si falla la red (Offline o AdBlock bloquea url), buscamos en caché
        return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // --- AQUÍ ESTÁ EL ARREGLO DEL ERROR ---
            // Si no hay red Y no hay caché, devolvemos una respuesta sintética
            // para evitar "Failed to convert value to Response".

            // 1. Si es una imagen (como via.placeholder.com), devolvemos un SVG gris
            if (event.request.headers.get('accept').includes('image')) {
                return new Response(
                    '<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#888">Offline</text></svg>',
                    { 
                        headers: { 
                            'Content-Type': 'image/svg+xml',
                            'Cache-Control': 'no-store'
                        } 
                    }
                );
            }

            // 2. Si es HTML (navegación), devolvemos el index (SPA) o un mensaje
            if (event.request.headers.get('accept').includes('text/html')) {
                 return caches.match('/index.html');
            }

            // 3. Para todo lo demás, un 404 silencioso en lugar de error de red
            return new Response('Offline / No disponible', { 
                status: 404, 
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/plain' } 
            });
        });
      })
  );
});

// --- 4. NOTIFICACIONES PUSH & ACTUALIZACIÓN UI ---
const GLOW_ICON_GRANDE = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';
const GLOW_BADGE_BLANCO = 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png';

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    // 1. PRIMERO: Intentar enviar los datos a la app abierta (UI Update)
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Enviamos mensaje a todas las pestañas abiertas
            clientList.forEach(client => {
                client.postMessage({
                    action: 'UPDATE_DATOS', // Etiqueta para identificar el mensaje
                    tipo: data.type,        // 'reservas' o 'mensajes'
                    payload: data.data      // El registro nuevo
                });
            });

            // 2. SEGUNDO: Mostrar notificación (Siempre, para asegurar que te enteras)
            // Si quieres que NO suene cuando tienes la app abierta, avísame.
            const title = data.title || 'Glow Admin';
            const options = {
                body: data.message || 'Nueva actividad',
                icon: GLOW_ICON_GRANDE,
                badge: GLOW_BADGE_BLANCO,
                vibrate: [100, 50, 100],
                data: { url: '/index.html' },
                tag: 'glow-notification', // Evita spam visual apilado
                renotify: true
            };
            return self.registration.showNotification(title, options);
        })
    );
});

