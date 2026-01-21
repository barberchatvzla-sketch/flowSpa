import { createClient } from '@supabase/supabase-js';

// Tus credenciales de Glow App
const SUPABASE_URL = 'https://chpzkhuvfstmmljozpjc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHpraHV2ZnN0bW1sam96cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQzMzksImV4cCI6MjA4NDM0MDMzOX0.uWRs0xB68ltUVEJPICFuS9vYCmDN06KTUfgbS_4W9WU';

const MY_DOMAIN = 'https://flow-spa-rose.vercel.app'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // 1. Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // 2. Obtener el código de negocio de la URL
    const { ref } = req.query;

    // Valores por defecto (Fallback)
    let title = "Glow App - Reservas";
    let description = "Reserva tu cita de belleza online.";
    let image = "https://i.ibb.co/99LsSW6N/Glow-20260112-140827-0000.png"; // Tu logo por defecto

    // 3. Consultar datos del negocio en Supabase
    try {
        if (ref) {
            const { data, error } = await supabase
                .from('negocios')
                .select('nombre_salon, imagen_portada')
                .eq('codigo_negocio', ref.toUpperCase())
                .single();

            if (data && !error) {
                title = `Reserva en ${data.nombre_salon}`;
                description = `Agenda tu cita en ${data.nombre_salon} fácilmente desde nuestra App.`;
                
                if (data.imagen_portada) {
                    // PLAN B: Usamos wsrv.nl para comprimir la imagen HD de Supabase 
                    // solo para la vista previa de WhatsApp. 
                    // Esto la hace pesar < 100kb y WhatsApp la mostrará siempre.
                    const originalUrl = data.imagen_portada;
                    image = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=600&h=600&fit=cover&output=jpg&q=80`;
                }
            }
        }
    } catch (e) {
        console.error("Error Supabase:", e);
    }

    // 4. Obtener el HTML base (spa.html)
    try {
        const htmlResponse = await fetch(`${MY_DOMAIN}/spa.html`);
        let html = await htmlResponse.text();

        // 5. Reemplazar los placeholders (Meta Tags)
        const currentUrl = `https://${req.headers.host}${req.url}`;
        
        html = html
            .replace(/__OG_TITLE__/g, title)
            .replace(/__OG_DESCRIPTION__/g, description)
            .replace(/__OG_IMAGE__/g, image)
            .replace(/__OG_URL__/g, currentUrl);
        
        // 6. Inyectar el código para el frontend
        if (ref) {
            const injection = `<script>window.NEGOCIO_ID_SERVER = "${ref.toUpperCase()}";</script>`;
            html = html.replace('</head>', `${injection}</head>`);
        }

        // 7. Enviar la respuesta como HTML
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error("Error cargando spa.html:", error);
        return res.status(500).send("Error interno del servidor");
    }
}
