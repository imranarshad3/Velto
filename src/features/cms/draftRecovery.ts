import type { PageContent } from './types.ts'

const KEY_PREFIX = 'velto-cms-unsaved:'

export interface LocalDraft {
  version: number
  content: PageContent
}

function storage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  try { return (globalThis as typeof globalThis & { localStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }).localStorage ?? null } catch { return null }
}

export function readLocalDraft(identity: string, target = storage()): LocalDraft | null {
  if (!target) return null
  try {
    const value = JSON.parse(target.getItem(KEY_PREFIX + identity) ?? 'null') as LocalDraft | null
    return value && Number.isInteger(value.version) && value.version >= 0 && value.content && typeof value.content === 'object' ? value : null
  } catch { return null }
}

export function writeLocalDraft(identity: string, version: number, content: PageContent, target = storage()) {
  try { target?.setItem(KEY_PREFIX + identity, JSON.stringify({ version, content } satisfies LocalDraft)) } catch { /* Recovery is best effort when storage is unavailable or full. */ }
}

export function clearLocalDraft(identity: string, target = storage()) {
  try { target?.removeItem(KEY_PREFIX + identity) } catch { /* Storage may be disabled. */ }
}
