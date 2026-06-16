export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const response = await fetch(
      `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}&hd=1`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'tiktok-video-no-watermark2.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();

    if (!data || data.code !== 0) {
      throw new Error('No se pudo obtener el video');
    }

    const video = data.data;

    return res.status(200).json({
      title: video.title || 'Video de TikTok',
      thumbnail: video.cover,
      videoUrl: video.play,
      audioUrl: video.music
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}