// sw-client.js
self.addEventListener('push', function(event) {
    if (event.data) {
        const payload = event.data.json();
        
        // Configuración visual de la notificación
        const options = {
            body: payload.message,
            icon: 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png', // Tu icono
            badge: 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png',
            vibrate: [100, 50, 100],
            data: { 
                // Construimos la URL para volver al negocio correcto
                url: self.registration.scope + 'spa.html?ref=' + payload.business_code 
            }
        };

        event.waitUntil(
            self.registration.showNotification(payload.title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // 1. Si la ventana ya está abierta, la enfocamos
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Verificamos si es la URL del SPA
                if (client.url.includes('spa.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. Si no está abierta, abrimos la SPA
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
