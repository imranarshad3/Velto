import { productPhotoLayout } from './productPhotoLayout.ts'

/** Local preparation only; AI analysis receives a separate smaller copy. */
export async function prepareProductPhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG or WebP photo up to 12 MB.')
  }
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) }
  catch { throw new Error('This photo could not be opened. Try another JPEG, PNG or WebP file.') }
  try {
    const layout = productPhotoLayout(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Photo preparation is unavailable in this browser.')
    // Reduce output dimensions only when necessary to meet the existing upload limit.
    for (let attempt = 0; attempt < 5; attempt++) {
      const factor = 0.8 ** attempt
      canvas.width = Math.max(1, Math.round(layout.width * factor))
      canvas.height = Math.max(1, Math.round(layout.height * factor))
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(1, canvas.width / bitmap.width, canvas.height / bitmap.height)
      const width = bitmap.width * scale, height = bitmap.height * scale
      ctx.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      const preview = canvas.toDataURL('image/webp', 0.92)
      if (!preview.startsWith('data:image/webp;')) throw new Error('This browser cannot prepare WebP photos.')
      const base64 = preview.split(',')[1]
      const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
      if (bytes <= 2_000_000) {
        const warnings: string[] = []
        if (Math.min(width, height) < 600) warnings.push('This photo may look soft on larger screens. Upload a clearer, higher-resolution original; resizing cannot restore missing detail.')
        if (attempt) warnings.push('The dimensions were reduced to keep this photo within the upload size limit.')
        return { base64, preview, width: canvas.width, height: canvas.height, bytes, warnings }
      }
    }
    throw new Error('This photo is still too large. Try a different photo.')
  } finally { bitmap.close() }
}
