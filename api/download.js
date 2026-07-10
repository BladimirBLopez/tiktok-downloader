// Backend unificado: detecta la plataforma y llama a un único proveedor
// ("Social Download All In One" en RapidAPI) que soporta TikTok, Instagram,
// Facebook, YouTube, X/Twitter y Pinterest con el mismo endpoint.
//
// Necesitás una RAPIDAPI_KEY suscrita a esa API (tiene plan gratuito).
// Variable de entorno en Vercel: RAPIDAPI_KEY

const RAPIDAPI_HOST = 'social-download-all-in-one.p.rapidapi.com';
const RAPIDAPI_ENDPOINT = `https://${RAPIDAPI_HOST}/v1/social/autolink`;

const PLATFORM_PATTERNS = [
  { id: 'tiktok', label: 'TikTok', domains: ['tiktok.com'] },
  { id: 'instagram', label: 'Instagram', domains: ['instagram.com'] },
  { id: 'facebook', label: 'Facebook', domains: ['facebook.com', 'fb.watch'] },
  { id: 'youtube', label: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { id: 'twitter', label: 'X / Twitter', domains: ['twitter.com', 'x.com'] },
  { id: 'pinterest', label: 'Pinterest', domains: ['pinterest.com', 'pin.it'] },
];

// Compara el hostname real, no un substring del link completo, para evitar
// falsos positivos (ej. "netflix.com" detectado como X/Twitter).
function getHostname(rawUrl) {
  try {
    const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function detectPlatform(url) {
  const hostname = getHostname(url);
  if (!hostname) return null;
  return PLATFORM_PATTERNS.find(p =>
    p.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))
  ) || null;
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
