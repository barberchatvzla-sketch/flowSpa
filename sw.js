// --- CONFIGURACIÓN DE IMÁGENES ---

// 1. EL LOGO GRANDE (Aparece a la derecha o al expandir)
// Este puede ser a color. Usamos el que ya tienes.
const GLOW_ICON_GRANDE = 'https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png';

// 2. EL ICONO PEQUEÑO (Badge - Barra de estado)
// IMPORTANTE: Cambia esta URL por tu imagen en SILUETA BLANCA y fondo transparente.
// Si dejas el logo a color aquí, Android volverá a poner el logo de Google.
const GLOW_BADGE_BLANCO = 'https://i.ibb.co/sd4ygWGr/Glow-20260112-165349-0000.png'; // <- ¡CAMBIAR ESTO POR LA VERSIÓN BLANCA!

self.addEventListener('push', function(event) {
    // Intentar leer los datos enviados desde Supabase/Servidor
    const data = event.data ? event.data.json() : {};
    
    // Definir Título y Mensaje por defecto si no llegan
    const title = data.title || 'Glow Admin';
    const message = data.message || 'Nueva actividad en el sistema';

    // Opciones de la notificación
    const options = {
        body: message,
        
        // Imagen principal (A la derecha del texto)
        icon: GLOW_ICON_GRANDE, 
        
        // Icono de la barra de estado (Monocromático/Blanco obligatorio para Android)
        badge: GLOW_BADGE_BLANCO,
        
        // Patrón de vibración [vibrar, pausa, vibrar]
        vibrate: [100, 50, 100],
        
        // Datos para usar al hacer clic (abrir la app)
        data: {
            url: '/index.html' // Asegura que abra tu panel admin
        },
        
        // Evita que se amontonen muchas notificaciones, reemplaza la anterior si tiene el mismo tag
        tag: 'glow-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// --- MANEJO DEL CLIC EN LA NOTIFICACIÓN ---
// Esto es vital para que al tocar la notificación se abra tu APK/Web
self.addEventListener('notificationclick', function(event) {
    // 1. Cerrar la notificación inmediatamente
    event.notification.close();

    // 2. Intentar enfocar una ventana abierta o abrir una nueva
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {
            // Si ya hay una ventana abierta, enfocarla
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventana abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('/index.html');
            }
        })
    );
});
