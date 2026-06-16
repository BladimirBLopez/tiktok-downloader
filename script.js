const btn = document.getElementById('download-btn');
const input = document.getElementById('tiktok-url');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const clearBtn = document.getElementById('clear-btn');

// Mostrar/ocultar botón limpiar
input.addEventListener('input', () => {
  clearBtn.style.display = input.value ? 'block' : 'none';
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  clearBtn.style.display = 'none';
  input.focus();
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-q').forEach(q => q.classList.remove('open'));
    if (!isOpen) {
      answer.classList.add('open');
      btn.classList.add('open');
    }
  });
});

// Descarga
btn.addEventListener('click', async () => {
  const url = input.value.trim();

  result.classList.add('hidden');
  errorBox.classList.add('hidden');
  loading.classList.remove('hidden');
  result.innerHTML = '';
  errorBox.textContent = '';

  if (!url) {
    loading.classList.add('hidden');
    errorBox.textContent = '⚠️ Por favor pega un enlace de TikTok.';
    errorBox.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Error al procesar el video');
    }

    result.innerHTML = `
      ${data.thumbnail ? `<img src="${data.thumbnail}" alt="Miniatura"/>` : ''}
      <h3>📹 ${data.title || 'Video de TikTok listo para descargar'}</h3>
      <div class="result-buttons">
        ${data.videoUrl ? `<a class="btn-dl mp4" href="${data.videoUrl}" target="_blank">⬇️ Descargar MP4</a>` : ''}
        ${data.audioUrl ? `<a class="btn-dl mp3" href="${data.audioUrl}" target="_blank">🎵 Descargar MP3</a>` : ''}
      </div>
    `;

    loading.classList.add('hidden');
    result.classList.remove('hidden');

  } catch (err) {
    loading.classList.add('hidden');
    errorBox.textContent = '❌ ' + err.message;
    errorBox.classList.remove('hidden');
  }
});