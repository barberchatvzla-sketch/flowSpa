import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Tus credenciales (Nota: asegúrate de que sean las correctas)
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
        const { ref } = req.query;
        const cleanRef = ref ? ref.replace(/\//g, '') : '';

        // 3. Obtener datos del negocio desde Supabase
        const { data: negocio, error } = await supabase
            .from('negocios')
            .select('*')
            .eq('codigo_negocio', cleanRef)
            .single();

        // Valores por defecto si falla la DB
        let title = "Glow App";
        let description = "Reserva tu cita fácilmente.";
        let image = "https://tu-dominio.com/default-og.jpg"; 

        if (negocio && !error) {
            title = negocio.nombre_negocio || title;
            description = `Reserva en ${negocio.nombre_negocio}`;
            // Si tienes un campo de imagen en la DB, úsalo aquí
        }

        // 4. LEER EL ARCHIVO LOCALMENTE (SOLUCIÓN DEL ERROR)
        // En lugar de fetch, usamos fs para leer el archivo del disco
        // Usamos process.cwd() pero nos aseguramos que Vercel sepa dónde buscar
const filePath = path.join(process.cwd(), 'spa.html');
        let html = fs.readFileSync(filePath, 'utf-8');

        // 5. REEMPLAZO DE VARIABLES SEO
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;

        html = html
            .replace(/__OG_TITLE__/g, title)
            .replace(/__OG_DESCRIPTION__/g, description)
            .replace(/__OG_IMAGE__/g, image)
            .replace(/__OG_URL__/g, `${protocol}://${host}/reserva/${cleanRef}`);

        // 6. INYECCIÓN CRÍTICA DEL CÓDIGO DE NEGOCIO
        const scriptInjection = `
            <script>
                window.BUSINESS_CODE_INJECTED = "${cleanRef || ''}";
                console.log("Modo Reserva Activado: ", window.BUSINESS_CODE_INJECTED);
            </script>
        </head>`;
        
        html = html.replace('</head>', scriptInjection);

        // 7. Enviar respuesta
        res.status(200).send(html);

    } catch (e) {
        console.error("Error en preview function:", e);
        // Si falla todo, intentamos redirigir al home o mostrar un error simple
        res.status(500).send("<h1>Error cargando la reserva. Por favor intenta de nuevo.</h1>");
    }
}
