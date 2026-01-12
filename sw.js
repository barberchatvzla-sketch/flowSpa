// TU LOGO OFICIAL
const GLOW_LOGO = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';

self.addEventListener('push', function(event) {
    // 1. Intentar leer los datos
    const data = event.data ? event.data.json() : {};
    
    // 2. Definir Título y Mensaje
    const title = data.title || 'Glow Admin';
    const message = data.message || 'Nueva actividad en el sistema';

    // 3. OPCIONES DE NOTIFICACIÓN
    const options = {
        body: message,
        
        // --- AQUÍ ESTÁ EL CAMBIO ---
        // Forzamos TU LOGO en ambos lugares. 
        // Ya no generará letras ni avatares automáticos.
        
        icon: GLOW_LOGO,  // La imagen grande a la derecha (Círculo)
        badge: GLOW_LOGO, // El icono pequeño (Barra de estado)
        
        // ---------------------------
        
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/index.html'
        },
        actions: [
            { action: 'open', title: 'Ver Mensaje' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// EVENTO AL HACER CLIC (Mantiene la funcionalidad de abrir la app)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then(windowClients => {
            for (let client of windowClients) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
