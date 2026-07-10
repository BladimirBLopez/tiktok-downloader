// ---------- Elements ----------
const btn = document.getElementById('download-btn');
const input = document.getElementById('video-url');
const wrapper = document.getElementById('input-wrapper');
const tag = document.getElementById('platform-tag');
const icon = document.getElementById('input-icon');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const clearBtn = document.getElementById('clear-btn');

// ---------- Platform detection ----------
const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', domains: ['tiktok.com'] },
  { id: 'instagram', label: 'Instagram', domains: ['instagram.com'] },
  { id: 'facebook', label: 'Facebook', domains: ['facebook.com', 'fb.watch'] },
  { id: 'youtube', label: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { id: 'twitter', label: 'X / Twitter', domains: ['twitter.com', 'x.com'] },
  { id: 'pinterest', label: 'Pinterest', domains: ['pinterest.com', 'pin.it'] },
];

// Compara el hostname real de la URL, no un substring del texto completo,
// para evitar falsos positivos (ej. "netflix.com" detectado como X/Twitter).
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
  return PLATFORMS.find(p =>
    p.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))
  ) || null;
}

function updatePlatformUI(url) {
  const match = detectPlatform(url);
  if (!url) {
    wrapper.dataset.platform = 'unknown';
    tag.hidden = true;
    icon.textContent = '🔗';
    return;
  }
  if (match) {
    wrapper.dataset.platform = match.id;
    tag.hidden = false;
    tag.textContent = `${match.label} ✓`;
    icon.textContent = '✅';
  } else {
    wrapper.dataset.platform = 'unknown';
    tag.hidden = false;
    tag.textContent = 'Verificando link...';
    icon.textContent = '🔗';
  }
}

input.addEventListener('input', () => {
  clearBtn.style.display = input.value ? 'block' : 'none';
  updatePlatformUI(input.value.trim());
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  clearBtn.style.display = 'none';
  updatePlatformUI('');
  input.focus();
});

// ---------- Headline rotator ----------
const rotatorItems = document.querySelectorAll('.rotator-item');
let rotatorIndex = 0;
if (rotatorItems.length > 1) {
  setInterval(() => {
    rotatorItems[rotatorIndex].classList.remove('is-active');
    rotatorIndex = (rotatorIndex + 1) % rotatorItems.length;
    rotatorItems[rotatorIndex].classList.add('is-active');
  }, 2200);
}

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const answer = q.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-q').forEach(x => x.classList.remove('open'));
    if (!isOpen) {
      answer.classList.add('open');
      q.classList.add('open');
    }
  });
});

// ---------- Download flow ----------
function renderResult(data) {
  const medias = Array.isArray(data.medias) ? data.medias : [];

  const isVideo = m => (m.type || '').toLowerCase().includes('video');
  const isAudio = m => (m.type || '').toLowerCase().includes('audio');

  const videoMedia = medias.find(isVideo);
  const audioMedia = medias.find(isAudio);
  // Si ningún item viene marcado como video ni audio, usamos el primero
  // como opción genérica, pero SIN llamarlo "video" para no mentir sobre
  // el contenido real del archivo (evita el caso de un pin/post que solo
  // trae audio y terminaba con un botón "Descargar video" apuntando a él).
  const genericMedia = !videoMedia && !audioMedia ? medias[0] : null;

  const buttonsHtml = [];
  if (videoMedia && videoMedia.url) {
    buttonsHtml.push(`<a class="btn-dl mp4" href="${videoMedia.url}" target="_blank" rel="noopener">⬇️ Descargar video</a>`);
  }
  if (audioMedia && audioMedia.url) {
    buttonsHtml.push(`<a class="btn-dl mp3" href="${audioMedia.url}" target="_blank" rel="noopener">🎵 Descargar audio (MP3)</a>`);
  }
  if (genericMedia && genericMedia.url) {
    buttonsHtml.push(`<a class="btn-dl alt" href="${genericMedia.url}" target="_blank" rel="noopener">⬇️ Descargar archivo</a>`);
  }
  // Cualquier otra calidad/opción extra que haya devuelto la API
  medias
    .filter(m => m !== videoMedia && m !== audioMedia && m !== genericMedia && m.url)
    .slice(0, 3)
    .forEach(m => {
      const label = m.quality || m.extension || 'Otra calidad';
      buttonsHtml.push(`<a class="btn-dl alt" href="${m.url}" target="_blank" rel="noopener">⬇️ ${label}</a>`);
    });

  if (buttonsHtml.length === 0) {
    throw new Error('No se encontraron archivos descargables para este link.');
  }

  result.innerHTML = `
    ${data.thumbnail ? `<img src="${data.thumbnail}" alt="Miniatura"/>` : ''}
    <h3>${data.title || 'Contenido listo para descargar'}</h3>
    <div class="result-meta">${data.platformLabel || ''}</div>
    <div class="result-buttons">${buttonsHtml.join('')}</div>
  `;
}

async function handleDownload() {
  const url = input.value.trim();

  result.classList.add('hidden');
  errorBox.classList.add('hidden');
  loading.classList.remove('hidden');
  result.innerHTML = '';
  errorBox.textContent = '';

  if (!url) {
    loading.classList.add('hidden');
    errorBox.textContent = '⚠️ Pegá primero el link del video o post.';
    errorBox.classList.remove('hidden');
    return;
  }

  const match = detectPlatform(url);
  if (!match) {
    loading.classList.add('hidden');
    errorBox.textContent = '⚠️ No reconocemos esa plataforma. Probá con TikTok, Instagram, Facebook, YouTube, X o Pinterest.';
    errorBox.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, platform: match.id })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Error al procesar el link');
    }

    renderResult({ ...data, platformLabel: match.label });

    loading.classList.add('hidden');
    result.classList.remove('hidden');

  } catch (err) {
    loading.classList.add('hidden');
    errorBox.textContent = '❌ ' + err.message;
    errorBox.classList.remove('hidden');
  }
}

btn.addEventListener('click', handleDownload);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleDownload();
});
