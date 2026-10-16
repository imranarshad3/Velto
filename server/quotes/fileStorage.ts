import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RESOURCE_BUCKET = 'technical-resources'

/** Private document storage. Browsers only ever get one-time upload URLs and short-lived download URLs. */
export interface FileStorage {
  /** One-time URL the admin's browser PUTs the file to. */
  createUpload(path: string, contentType: string): Promise<{ url: string; headers: Record<string, string> }>
  stat(path: string): Promise<{ size: number; contentType: string } | null>
  /** Short-lived URL that downloads the file under `fileName`. */
  downloadUrl(path: string, fileName: string): Promise<string>
  remove(path: string): Promise<void>
  /** Local-only stores receive uploads through the API itself (no external storage). */
  acceptUpload?(token: string, body: ArrayBuffer, contentType: string): boolean
  read?(path: string): { body: ArrayBuffer; contentType: string } | null
}

/** `<uuid>/<safe-name>.pdf`, matching the database check constraint. */
export function resourcePath(fileName: string) {
  const base =
    fileName
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 100) || 'document'
  return `${randomUUID()}/${base}.pdf`
}

export function createSupabaseFileStorage(db: SupabaseClient): FileStorage {
  const bucket = () => db.storage.from(RESOURCE_BUCKET)
  return {
    async createUpload(path, contentType) {
      const { data, error } = await bucket().createSignedUploadUrl(path)
      if (error || !data) throw new Error(`storage upload url failed (${error?.message ?? 'unknown'})`)
      return { url: data.signedUrl, headers: { 'content-type': contentType, 'x-upsert': 'false' } }
    },
    async stat(path) {
      const slash = path.lastIndexOf('/')
      const { data, error } = await bucket().list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 1 })
      if (error) throw new Error(`storage stat failed (${error.message})`)
      const file = data?.find((f) => f.name === path.slice(slash + 1))
      const meta = file?.metadata as { size?: number; mimetype?: string } | undefined
      return file && meta ? { size: Number(meta.size ?? 0), contentType: meta.mimetype ?? '' } : null
    },
    async downloadUrl(path, fileName) {
      const safeName = fileName.replace(/[^\w.-]+/g, '_')
      const { data, error } = await bucket().createSignedUrl(path, 60, { download: safeName })
      if (error || !data) throw new Error(`storage download url failed (${error?.message ?? 'unknown'})`)
      return data.signedUrl
    },
    async remove(path) {
      const { error } = await bucket().remove([path])
      if (error) throw new Error(`storage remove failed (${error.message})`)
    },
  }
}

/** In-memory storage for tests and opt-in local development only. */
export function createMemoryFileStorage(): FileStorage {
  const files = new Map<string, { body: ArrayBuffer; contentType: string }>()
  const uploads = new Map<string, string>()
  return {
    async createUpload(path, contentType) {
      const token = randomUUID()
      uploads.set(token, path)
      return { url: `/api/admin/uploads/${token}`, headers: { 'content-type': contentType } }
    },
    async stat(path) {
      const f = files.get(path)
      return f ? { size: f.body.byteLength, contentType: f.contentType } : null
    },
    async downloadUrl(path) {
      return `memory:${path}`
    },
    async remove(path) {
      files.delete(path)
    },
    acceptUpload(token, body, contentType) {
      const path = uploads.get(token)
      if (!path) return false
      uploads.delete(token)
      files.set(path, { body, contentType })
      return true
    },
    read: (path) => files.get(path) ?? null,
  }
}
