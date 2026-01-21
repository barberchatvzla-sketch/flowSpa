import { createClient } from '@supabase/supabase-js';

// Tus credenciales
const SUPABASE_URL = 'https://chpzkhuvfstmmljozpjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHpraHV2ZnN0bW1sam96cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQzMzksImV4cCI6MjA4NDM0MDMzOX0.uWRs0xB68ltUVEJPICFuS9vYCmDN06KTUfgbS_4W9WU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    // 1. Configurar CORS y Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    try {
        // 2. Obtener la referencia (código de negocio)
        // Eliminamos posibles slashes extra al inicio
        const { ref } = req.query;
        const cleanRef = ref ? ref.replace(/\//g, '') : '';

        // 3. Valores por defecto
        let title = "Glow App";
        let description = "Reserva tu cita de belleza fácilmente.";
        let image = "https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png";

        // 4. Consultar Supabase si hay referencia
        if (cleanRef) {
            const { data: storeData, error } = await supabase
                .from('negocios')
                .select('nombre_salon, logo_salon, imagen_portada')
                .eq('codigo_negocio', cleanRef.toUpperCase())
                .single();

            if (storeData && !error) {
                title = `Reserva en ${storeData.nombre_salon}`;
                description = `Reserva tu cita en ${storeData.nombre_salon} a través de nuestra App.`;
                
                if (storeData.logo_salon) image = storeData.logo_salon;
                else if (storeData.imagen_portada) image = storeData.imagen_portada;
            }
        }

        // 5. Obtener el HTML plantilla (spa.html)
        // Usamos la URL base de la petición actual para hacer el fetch a uno mismo
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        
        // Importante: forzar la ruta absoluta correcta
        const htmlResponse = await fetch(`${protocol}://${host}/spa.html`);
        
        if (!htmlResponse.ok) throw new Error("No se pudo cargar spa.html");
        
        let html = await htmlResponse.text();

        // 6. REEMPLAZO DE VARIABLES
        // Reemplazamos los Placeholders de SEO
        html = html
            .replace(/__OG_TITLE__/g, title)
            .replace(/__OG_DESCRIPTION__/g, description)
            .replace(/__OG_IMAGE__/g, image)
            .replace(/__OG_URL__/g, `${protocol}://${host}/reserva/${cleanRef}`);

        // 7. INYECCIÓN CRÍTICA DEL CÓDIGO DE NEGOCIO
        // Buscamos una etiqueta script o el head para inyectar la variable global
        // Esto permite que spa.html sepa quién es el negocio sin leer la URL
        const scriptInjection = `
            <script>
                window.BUSINESS_CODE_INJECTED = "${cleanRef || ''}";
                console.log("Modo Reserva Activado: ", window.BUSINESS_CODE_INJECTED);
            </script>
        </head>`;
        
        html = html.replace('</head>', scriptInjection);

        // 8. Enviar respuesta
        res.status(200).send(html);

    } catch (e) {
        console.error("Error en preview function:", e);
        // Si falla, intentamos devolver un HTML básico o redireccionar al index
        res.status(500).send('<h1>Error cargando la previsualización</h1>');
    }
}
