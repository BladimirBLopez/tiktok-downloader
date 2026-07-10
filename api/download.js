// Backend unificado: detecta la plataforma y llama a un único proveedor
// ("Social Download All In One" en RapidAPI) que soporta TikTok, Instagram,
// Facebook, YouTube, X/Twitter y Pinterest con el mismo endpoint.
//
// Necesitás una RAPIDAPI_KEY suscrita a esa API (tiene plan gratuito).
// Variable de entorno en Vercel: RAPIDAPI_KEY

const RAPIDAPI_HOST = 'social-download-all-in-one.p.rapidapi.com';
const RAPIDAPI_ENDPOINT = `https://${RAPIDAPI_HOST}/v1/social/autolink`;

const PLATFORM_PATTERNS = [
  { id: 'tiktok', label: 'TikTok', regex: /tiktok\.com/i },
  { id: 'instagram', label: 'Instagram', regex: /instagram\.com/i },
  { id: 'facebook', label: 'Facebook', regex: /(facebook\.com|fb\.watch)/i },
  { id: 'youtube', label: 'YouTube', regex: /(youtube\.com|youtu\.be)/i },
  { id: 'twitter', label: 'X / Twitter', regex: /(twitter\.com|x\.com)/i },
  { id: 'pinterest', label: 'Pinterest', regex: /(pinterest\.com|pin\.it)/i },
];

function detectPlatform(url) {
  return PLATFORM_PATTERNS.find(p => p.regex.test(url)) || null;
}

// La respuesta exacta de la API puede variar de versión en versión.
// Esta función intenta varias formas comunes de estructurar los medios
// para no romper el frontend si el nombre de un campo cambia.
function normalizeMedias(raw) {
  const list = raw.medias || raw.medias_list || raw.data || raw.urls || raw.links || [];
  if (!Array.isArray(list)) return [];

  return list
    .map(item => ({
      url: item.url || item.link || item.download_url || item.src || null,
      type: item.type || item.media_type || (item.extension === 'mp3' ? 'audio' : 'video'),
      quality: item.quality || item.resolution || item.label || null,
      extension: item.extension || item.ext || null,
    }))
    .filter(m => m.url);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ error: 'No reconocemos esa plataforma todavía' });
  }

  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Falta configurar RAPIDAPI_KEY en el servidor' });
  }

  try {
    const response = await fetch(RAPIDAPI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
      body: JSON.stringify({ url }),
    });

    const raw = await response.json();

    if (!response.ok || raw.error) {
      throw new Error(raw.error || raw.message || 'No se pudo procesar el link');
    }

    const medias = normalizeMedias(raw);

    if (medias.length === 0) {
      throw new Error('No se encontraron archivos descargables para este link.');
    }

    return res.status(200).json({
      platform: platform.id,
      title: raw.title || raw.description || `Contenido de ${platform.label}`,
      thumbnail: raw.thumbnail || raw.cover || raw.thumb || null,
      medias,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
