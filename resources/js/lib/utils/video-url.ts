/**
 * Convierte cualquier URL de YouTube o Vimeo en una URL de embed
 * lista para usar en un <iframe>.
 *
 * Formatos soportados de YouTube:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID  (ya es embed)
 *  - https://youtube.com/shorts/VIDEO_ID
 *
 * Formatos soportados de Vimeo:
 *  - https://vimeo.com/VIDEO_ID
 *  - https://player.vimeo.com/video/VIDEO_ID (ya es embed)
 */
export function toEmbedUrl(url: string): string {
  if (!url) return url

  // ── YouTube ──────────────────────────────────────────────────────
  // youtu.be/VIDEO_ID
  const shortYT = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortYT) return `https://www.youtube.com/embed/${shortYT[1]}`

  // youtube.com/shorts/VIDEO_ID
  const shortsYT = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsYT) return `https://www.youtube.com/embed/${shortsYT[1]}`

  // youtube.com/watch?v=VIDEO_ID
  const watchYT = url.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/)
  if (watchYT) return `https://www.youtube.com/embed/${watchYT[1]}`

  // ya es embed de YouTube
  if (url.includes("youtube.com/embed/")) return url

  // ── Vimeo ────────────────────────────────────────────────────────
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  // ya es embed de Vimeo
  if (url.includes("player.vimeo.com/video/")) return url

  // Devuelve la URL original si no se reconoce el formato
  return url
}

/** Extrae el ID de un video de YouTube, o null si no es YouTube. */
export function getYouTubeId(url: string): string | null {
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (short) return short[1]

  const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shorts) return shorts[1]

  const watch = url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)([a-zA-Z0-9_-]{11})/)
  if (watch) return watch[1]

  return null
}

/** Devuelve la URL de la miniatura de YouTube, o null si no aplica. */
export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
