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
  { id: 'tiktok', label: 'TikTok', regex: /tiktok\.com/i },
  { id: 'instagram', label: 'Instagram', regex: /instagram\.com/i },
  { id: 'facebook', label: 'Facebook', regex: /(facebook\.com|fb\.watch)/i },
  { id: 'youtube', label: 'YouTube', regex: /(youtube\.com|youtu\.be)/i },
  { id: 'twitter', label: 'X / Twitter', regex: /(twitter\.com|x\.com)/i },
  { id: 'pinterest', label: 'Pinterest', regex: /(pinterest\.com|pin\.it)/i },
];

function detectPlatform(url) {
  return PLATFORMS.find(p => p.regex.test(url)) || null;
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

  // Try to split into a best video option and a best audio option.
  const videoMedia = medias.find(m => (m.type || '').toLowerCase().includes('video')) || medias[0];
  const audioMedia = medias.find(m => (m.type || '').toLowerCase().includes('audio'));

  const buttonsHtml = [];
  if (videoMedia && videoMedia.url) {
    buttonsHtml.push(`<a class="btn-dl mp4" href="${videoMedia.url}" target="_blank" rel="noopener">⬇️ Descargar video</a>`);
  }
  if (audioMedia && audioMedia.url) {
    buttonsHtml.push(`<a class="btn-dl mp3" href="${audioMedia.url}" target="_blank" rel="noopener">🎵 Descargar audio (MP3)</a>`);
  }
  // Any extra quality options beyond the two picked above
  medias
    .filter(m => m !== videoMedia && m !== audioMedia && m.url)
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
