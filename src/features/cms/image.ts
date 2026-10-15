/** Decode, crop and re-encode raster uploads; strip metadata and cap stored dimensions. */
export async function prepareImage(file: File, crop: 'original' | 'square' | 'wide', focusX = 50, focusY = 50): Promise<{base64: string; preview: string; width: number; height: number}> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) throw new Error('Choose a JPEG, PNG or WebP image up to 12 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error('Choose an image smaller than 40 megapixels.')
    const ratio = crop === 'square' ? 1 : crop === 'wide' ? 16/9 : bitmap.width/bitmap.height
    const sw = Math.min(bitmap.width, bitmap.height * ratio), sh = sw/ratio
    const scale = Math.min(1, 1920/sw, 1920/sh)
    const canvas = document.createElement('canvas'); canvas.width = Math.round(sw*scale); canvas.height = Math.round(sh*scale)
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image processing is unavailable.')
    ctx.drawImage(bitmap, (bitmap.width-sw)*focusX/100, (bitmap.height-sh)*focusY/100, sw, sh, 0, 0, canvas.width, canvas.height)
    const preview = canvas.toDataURL('image/webp', 0.84)
    if (!preview.startsWith('data:image/webp;')) throw new Error('This browser cannot prepare WebP images.')
    const base64 = preview.split(',')[1]
    if (base64.length > 2_790_000) throw new Error('Image is too large after optimization. Use a smaller crop.')
    return {base64, preview, width: canvas.width, height: canvas.height}
  } finally { bitmap.close() }
}
