self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || 'Nueva Notificación';
    const options = {
        body: data.message || 'Tienes una nueva actividad en el sistema.',
        icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041883.png', // Puedes poner tu logo aquí
        badge: 'https://cdn-icons-png.flaticon.com/512/1041/1041883.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/admin.html' // A dónde ir al hacer click
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});