import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const MAX_WISHLIST = 100

interface WishlistStore {
  slugs: string[]
  /** Account the local list belongs to; null = saved as a guest. Prevents mixing accounts on shared browsers. */
  ownerId: string | null
  toggle: (slug: string) => boolean
  remove: (slug: string) => void
  replace: (slugs: string[], ownerId?: string | null) => void
}

const valid = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9-]{1,80}$/.test(s)
const clean = (slugs: unknown[]) => [...new Set(slugs.filter(valid))].slice(0, MAX_WISHLIST)

/** Saved products. Local per browser; synced to the account when signed in (see WishlistSync). */
export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      slugs: [],
      ownerId: null,
      toggle: (slug) => {
        const saved = get().slugs.includes(slug)
        set({ slugs: saved ? get().slugs.filter((s) => s !== slug) : [slug, ...get().slugs].slice(0, MAX_WISHLIST) })
        return !saved
      },
      remove: (slug) => set({ slugs: get().slugs.filter((s) => s !== slug) }),
      replace: (slugs, ownerId) => set({ slugs: clean(slugs), ...(ownerId !== undefined ? { ownerId } : {}) }),
    }),
    {
      name: 'novaro-wishlist-v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as { slugs?: unknown; ownerId?: unknown } | undefined
        return {
          ...current,
          slugs: Array.isArray(p?.slugs) ? clean(p.slugs) : [],
          ownerId: typeof p?.ownerId === 'string' ? p.ownerId : null,
        }
      },
    },
  ),
)
