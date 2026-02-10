// sw-client.js - VERSIÓN CORREGIDA PARA CHAT EN VIVO

self.addEventListener('push', function(event) {
    let payload = {};
    if (event.data) {
        try { payload = event.data.json(); } catch(e) { console.error('Error parse JSON', e); }
    }

    // 1. Configuración de la Notificación Visual (Lo que se ve en la barra de estado)
    const title = payload.title || 'Glow App';
    const options = {
        body: payload.message || 'Tienes un nuevo mensaje',
        icon: 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png', // Icono Glow
        badge: 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png', // Badge pequeño
        vibrate: [100, 50, 100],
        tag: 'glow-msg-' + Date.now(), // Tag único para que no se sobrescriban
        data: { 
            // Guardamos la URL para abrirla al hacer click
            url: self.registration.scope + 'spa.html?ref=' + (payload.business_code || 'DEMO')
        }
    };

    // 2. Mostrar la notificación visual
    const showNotificationPromise = self.registration.showNotification(title, options);

    // 3. ENVIAR DATOS A LA APP ABIERTA (La magia del tiempo real)
    const sendToClientPromise = self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true
    }).then((clientList) => {
        for (const client of clientList) {
            // Enviamos el mensaje al frontend con la estructura EXACTA que espera tu chat
            client.postMessage({
                action: 'NUEVA_DATA_PUSH_CLIENTE',
                tipo: payload.type,   // ej: 'mensajes'
                record: payload.data  // El objeto del mensaje que viene de Supabase
            });
        }
    });

    event.waitUntil(Promise.all([showNotificationPromise, sendToClientPromise]));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Si la app ya está abierta, la enfocamos
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('spa.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, abrimos una ventana nueva
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
