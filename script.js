const btn = document.getElementById('download-btn');
const input = document.getElementById('tiktok-url');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

btn.addEventListener('click', async () => {
  const url = input.value.trim();

  // Resetear estado
  result.classList.add('hidden');
  error.classList.add('hidden');
  loading.classList.remove('hidden');
  result.innerHTML = '';
  error.textContent = '';

  if (!url) {
    loading.classList.add('hidden');
    error.textContent = '⚠️ Por favor pega un enlace de TikTok.';
    error.classList.remove('hidden');
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

    // Mostrar resultado
    result.innerHTML = `
      ${data.thumbnail ? `<img src="${data.thumbnail}" alt="Miniatura del video"/>` : ''}
      <h3>📥 ${data.title || 'Video listo para descargar'}</h3>
      ${data.videoUrl ? `<a class="btn-download" href="${data.videoUrl}" target="_blank">⬇️ Descargar MP4</a>` : ''}
      ${data.audioUrl ? `<a class="btn-download mp3" href="${data.audioUrl}" target="_blank">🎵 Descargar MP3</a>` : ''}
    `;

    loading.classList.add('hidden');
    result.classList.remove('hidden');

  } catch (err) {
    loading.classList.add('hidden');
    error.textContent = '❌ ' + err.message;
    error.classList.remove('hidden');
  }
});