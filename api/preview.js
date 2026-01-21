import { createClient } from '@supabase/supabase-js';

// Usamos tus credenciales (En producción idealmente usa variables de entorno)
const SUPABASE_URL = 'https://chpzkhuvfstmmljozpjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHpraHV2ZnN0bW1sam96cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQzMzksImV4cCI6MjA4NDM0MDMzOX0.uWRs0xB68ltUVEJPICFuS9vYCmDN06KTUfgbS_4W9WU';

// Cambia esto por tu dominio real de Vercel cuando despliegues
const MY_DOMAIN = 'https://glow-app-rho.vercel.app'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    // Permitir acceso CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // Obtenemos el código del negocio desde la URL reescrita
    const { ref } = req.query;

    // Valores por defecto
    let title = "Glow App - Reserva tu Cita";
    let description = "Agenda tu experiencia de belleza y bienestar de forma rápida.";
    let image = "https://i.ibb.co/67C1hcrb/1767558273844.png"; // Tu imagen por defecto

    try {
        if (ref) {
            // Buscamos en tu tabla 'negocios' usando 'codigo_negocio'
            const { data: storeData, error } = await supabase
                .from('negocios')
                .select('nombre_salon, logo_salon, imagen_portada')
                .eq('codigo_negocio', ref.toUpperCase())
                .single();

            if (storeData && !error) {
                // Personalizamos los metadatos
                title = `Reserva en ${storeData.nombre_salon}`;
                description = `Hola, reserva tu cita en ${storeData.nombre_salon} fácilmente a través de nuestra App.`;
                
                // Prioridad de imagen: Logo -> Portada -> Default
                if (storeData.logo_salon) {
                    image = storeData.logo_salon;
                } else if (storeData.imagen_portada) {
                    image = storeData.imagen_portada;
                }
            }
        }
    } catch (e) {
        console.error("Error en preview:", e);
    }

    // Leemos el HTML plantilla (spa.html)
    // Nota: Al ejecutarse en Vercel, fetch a localhost o al dominio propio funciona
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const htmlResponse = await fetch(`${protocol}://${host}/spa.html`);
    let html = await htmlResponse.text();

    // Inyectamos los datos reales reemplazando los placeholders
    html = html
        .replace(/__OG_TITLE__/g, title)
        .replace(/__OG_DESCRIPTION__/g, description)
        .replace(/__OG_IMAGE__/g, image)
        .replace(/__OG_URL__/g, `${protocol}://${host}/reserva/${ref || ''}`);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
}
