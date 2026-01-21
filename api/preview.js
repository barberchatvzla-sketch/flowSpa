import { createClient } from '@supabase/supabase-js';

// Tus credenciales de Glow App (tomadas de tu spa.html)
const SUPABASE_URL = 'https://chpzkhuvfstmmljozpjc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHpraHV2ZnN0bW1sam96cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQzMzksImV4cCI6MjA4NDM0MDMzOX0.uWRs0xB68ltUVEJPICFuS9vYCmDN06KTUfgbS_4W9WU';

// ¡IMPORTANTE! CAMBIA ESTO POR TU URL REAL DE VERCEL SIN BARRA AL FINAL
const MY_DOMAIN = 'https://flow-spa-rose.vercel.app'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // 1. Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // 2. Obtener el código de negocio de la URL (ej: /reserva/GLOW)
    const { ref } = req.query;

    // Datos por defecto
    let title = "Glow App";
    let description = "Reserva tu cita de belleza y bienestar.";
    let image = `${MY_DOMAIN}/default-cover.png`; // Asegúrate de tener una imagen por defecto

    try {
        if (ref) {
            // 3. Consultar a Supabase
            const { data, error } = await supabase
                .from('negocios')
                .select('nombre_salon, imagen_portada')
                .eq('codigo_negocio', ref.toUpperCase())
                .single();

            if (data && !error) {
                title = `Reserva en ${data.nombre_salon}`;
                description = `Agenda tu cita en ${data.nombre_salon} fácilmente.`;
                if (data.imagen_portada) image = data.imagen_portada;
            }
        }
    } catch (e) {
        console.error("Error Supabase:", e);
    }

    // 4. Obtener el HTML público (Técnica "Fetch" del sistema funcional)
    // Leemos spa.html porque es la base de tu app
    const htmlResponse = await fetch(`${MY_DOMAIN}/spa.html`);
    let html = await htmlResponse.text();

    // 5. Reemplazar los placeholders (Meta Tags)
    html = html
        .replace(/__OG_TITLE__/g, title)
        .replace(/__OG_DESCRIPTION__/g, description)
        .replace(/__OG_IMAGE__/g, image)
        .replace(/__OG_URL__/g, `https://${req.headers.host}${req.url}`);
    
    // 6. Inyectar el código de negocio para que la App cargue rápido
    // Esto ayuda a tu script del frontend a saber qué negocio cargar sin leer la URL de nuevo
    if (ref) {
        const injection = `<script>window.NEGOCIO_ID_SERVER = "${ref.toUpperCase()}";</script>`;
        html = html.replace('<head>', `<head>${injection}`);
    }

    // 7. Servir
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
}
