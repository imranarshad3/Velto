import { useEffect } from 'react'
import { useAppAuth } from '../../lib/auth/context.ts'
import { fetchWishlist, saveWishlist } from '../quotes/api.ts'
import { useWishlist } from './wishlistStore.ts'

/**
 * Keeps the local wishlist and the signed-in account in sync: merges guest-saved items on sign-in,
 * saves changes (debounced), and clears an account's local copy once signed out.
 */
export default function WishlistSync() {
  const { signedIn, loaded, user, getToken } = useAppAuth()
  const userId = user?.id

  useEffect(() => {
    if (!loaded) return
    if (!signedIn || !userId) {
      // Signed out (in-app or expired session): an account's list must not stay visible to the next person.
      if (useWishlist.getState().ownerId) useWishlist.getState().replace([], null)
      return
    }
    // Claim the local list for this account immediately (even if the network fails): guest-saved
    // items carry over, another account's leftovers are discarded.
    const local = useWishlist.getState()
    if (local.ownerId !== userId) local.replace(local.ownerId === null ? local.slugs : [], userId)

    let ready = false
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const push = async (slugs: string[]) => {
      const token = await getToken()
      if (!token || cancelled) return
      const saved = await saveWishlist(slugs, token)
      if (!cancelled) useWishlist.getState().replace(saved.slugs, userId)
    }

    ;(async () => {
      try {
        const token = await getToken()
        if (!token) return
        const server = (await fetchWishlist(token)).slugs
        if (cancelled) return
        const merged = [...new Set([...useWishlist.getState().slugs, ...server])]
        if (merged.length !== server.length) await push(merged)
        else useWishlist.getState().replace(server, userId)
        ready = true
      } catch {
        ready = true // keep working locally; next change retries the save
      }
    })()

    const unsubscribe = useWishlist.subscribe((state, prev) => {
      if (!ready || state.slugs === prev.slugs) return
      clearTimeout(timer)
      timer = setTimeout(() => void push(state.slugs).catch(() => {}), 600)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      unsubscribe()
    }
  }, [loaded, signedIn, userId, getToken])

  return null
}
