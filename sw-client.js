// sw-client.js
self.addEventListener('push', function(event) {
    let payload = {};
    if (event.data) {
        try { payload = event.data.json(); } catch(e) { console.error(e); }
    }

    // 1. Configuración visual (Notificación del sistema)
    const options = {
        body: payload.message || 'Tienes un nuevo mensaje',
        icon: 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png',
        badge: 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png',
        vibrate: [100, 50, 100],
        tag: 'glow-client-msg-' + Date.now(), // Evita agruparlas demasiado
        data: { 
            url: self.registration.scope + 'spa.html?ref=' + (payload.business_code || 'DEMO')
        }
    };

    // 2. Promesa para mostrar la notificación visual
    const showNotificationPromise = self.registration.showNotification(payload.title || 'Glow App', options);

    // 3. Promesa para avisar a la App abierta (Igual que en Admin)
    const sendToClientPromise = self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true
    }).then((clientList) => {
        for (const client of clientList) {
            // Enviamos el mensaje al frontend (spa.html)
            client.postMessage({
                action: 'NUEVA_DATA_PUSH_CLIENTE',
                payload: payload // Pasamos todo el payload que envió Pipedream
            });
        }
    });

    event.waitUntil(Promise.all([showNotificationPromise, sendToClientPromise]));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Si ya está abierta, enfocarla
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('spa.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrirla
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
