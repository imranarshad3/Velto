/** Fit the full original photo within the store limit, without cropping or enlarging pixels. */
export function productPhotoLayout(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width * height > 40_000_000) {
    throw new Error('Choose a valid photo smaller than 40 megapixels.')
  }
  const scale = Math.min(1, 1600 / width, 1600 / height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}
