# Bajalo

Descarga video o audio (MP3) de TikTok, Instagram, Facebook, YouTube, X/Twitter y Pinterest desde un solo sitio.

## Cómo funciona

- El frontend detecta la plataforma según el link pegado (`script.js`).
- `api/download.js` es una función serverless de Vercel que llama a la API
  **"Social Download All In One"** de RapidAPI (host `social-download-all-in-one.p.rapidapi.com`),
  que soporta las 6 plataformas con un mismo endpoint.

## Configuración en Vercel

1. Suscribite a la API en RapidAPI: busca "Social Download All In One".
2. En Vercel → tu proyecto → Settings → Environment Variables, agregá:
   - `RAPIDAPI_KEY` = tu clave de RapidAPI
3. Deploy.

## Importante: verificar el formato de respuesta

No pude probar la API en vivo al armar esto (sin acceso a internet en el entorno
de build). El código en `api/download.js` normaliza varios formatos posibles
de respuesta (`medias`, `data`, `urls`...), pero **cuando tengas tu API key real,
probá con un link y revisá la respuesta cruda** (podés loguearla temporalmente
con `console.log(raw)` dentro de `download.js`) para confirmar los nombres de
campo exactos y ajustar `normalizeMedias()` si hace falta. Es la única parte
que depende de algo que no pude verificar yo mismo.

## Estructura

```
index.html      → estructura de la página
style.css       → diseño (paleta, tipografía, componentes)
script.js       → detección de plataforma + flujo de descarga
api/download.js → función serverless (Vercel)
```
