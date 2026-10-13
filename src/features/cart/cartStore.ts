import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { QuantityUnit } from '../quotes/schema.ts'

export const MAX_CART_ITEMS = 20

export interface CartItem {
  slug: string
  quantity?: number
  unit?: QuantityUnit
}

interface CartStore {
  items: CartItem[]
  add: (slug: string) => 'added' | 'exists' | 'full'
  update: (slug: string, patch: Partial<Omit<CartItem, 'slug'>>) => void
  remove: (slug: string) => void
  clear: () => void
}

/** Quote basket. Persisted per browser; holds product slugs and optional quantities only (no prices). */
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (slug) => {
        const { items } = get()
        if (items.some((i) => i.slug === slug)) return 'exists'
        if (items.length >= MAX_CART_ITEMS) return 'full'
        set({ items: [...items, { slug }] })
        return 'added'
      },
      update: (slug, patch) => set({ items: get().items.map((i) => (i.slug === slug ? { ...i, ...patch } : i)) }),
      remove: (slug) => set({ items: get().items.filter((i) => i.slug !== slug) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'novaro-cart-v1',
      storage: createJSONStorage(() => localStorage),
      // Defensive rehydrate: storage is user-editable.
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown })?.items
        const items = Array.isArray(raw)
          ? raw
              .filter((i): i is CartItem => typeof i?.slug === 'string' && /^[a-z0-9-]{1,80}$/.test(i.slug))
              .slice(0, MAX_CART_ITEMS)
          : []
        return { ...current, items }
      },
    },
  ),
)
