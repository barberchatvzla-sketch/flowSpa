// TU LOGO OFICIAL
const GLOW_LOGO = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';

self.addEventListener('push', function(event) {
    // 1. Intentar leer los datos que envía Pipedream
    const data = event.data ? event.data.json() : {};
    
    // 2. Definir Título y Mensaje
    const title = data.title || 'Glow Admin';
    const message = data.message || 'Nueva actividad en el sistema';

    // 3. LÓGICA DE LA IMAGEN DEL CLIENTE (El "Hack" Inteligente)
    // Como no puedes editar Pipedream, asumimos que el nombre del cliente viene en el Título.
    // Usamos 'ui-avatars.com' para crear una imagen con sus iniciales al instante.
    
    let clientIcon = GLOW_LOGO; // Por defecto el logo
    
    if (data.image) {
        // Si Pipedream manda una imagen específica, úsala.
        clientIcon = data.image;
    } else if (title && title !== 'Glow Admin') {
        // Si no hay imagen, generamos un Avatar con el Título (ej: "Maria Perez")
        // background=000 (Negro) y color=E000E0 (Tu fucsia exacto)
        const cleanName = encodeURIComponent(title);
        clientIcon = `https://ui-avatars.com/api/?name=${cleanName}&background=050505&color=E000E0&size=192&rounded=true&bold=true`;
    }

    const options = {
        body: message,
        
        // El icono grande a la derecha/izquierda (La cara del cliente o iniciales)
        icon: clientIcon,
        
        // El icono pequeño monocromático para la barra de estado (Android)
        badge: GLOW_LOGO,
        
        // Patrón de vibración
        vibrate: [100, 50, 100],
        
        // Datos para usar al hacer clic
        data: {
            url: data.url || '/index.html'
        },
        
        // Acciones interactivas (opcional, se ven en algunos Android/PC)
        actions: [
            { action: 'open', title: 'Ver Mensaje' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// EVENTO AL HACER CLIC EN LA NOTIFICACIÓN
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then(windowClients => {
            // Si ya tienes la app abierta, la enfoca en lugar de abrir una nueva pestaña
            for (let client of windowClients) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, la abre
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
