import { catalog } from '../../src/data/catalog.js'
import { createClerkVerifier, type AuthVerifier } from './auth.js'
import { createClerkDirectory, withDevDirectory } from './directory.js'
import { createApiHandlers } from './handlers.js'
import { createClient } from '@supabase/supabase-js'
import { createMemoryFileStorage, createSupabaseFileStorage, type FileStorage } from './fileStorage.js'
import { createMemoryStore } from './memoryStore.js'
import type { DataStore } from './store.js'
import { createSupabaseStore } from './supabaseStore.js'
import { createTurnstileCheck } from './turnstile.js'

const bundledSlugs = new Set(catalog.map((product) => product.slug))
const CATALOG_TTL_MS = 60_000
const list = (value: string | undefined) => (value ?? '').split(',').map((v) => v.trim()).filter(Boolean)

let devStore: DataStore | undefined
let devFiles: FileStorage | undefined

const isDeployed = (env: NodeJS.ProcessEnv) => env.VERCEL === '1' || env.NODE_ENV === 'production'

/**
 * LOCAL TESTING ONLY: accepts `dev:<id>` bearer tokens so account/admin UIs can be exercised without Clerk.
 * Requires NOVARO_DEV_FAKE_AUTH=1 and is impossible to enable on Vercel/production.
 */
export function withDevAuth(env: NodeJS.ProcessEnv, verifier: AuthVerifier): AuthVerifier {
  if (isDeployed(env) || env.NOVARO_DEV_FAKE_AUTH !== '1') return verifier
  return async (token, origin) => {
    const match = token ? /^dev:(dev_[a-z0-9_]{1,40})$/.exec(token) : null
    return match ? { kind: 'user', userId: match[1] } : verifier(token, origin)
  }
}

function resolveStore(env: NodeJS.ProcessEnv): DataStore | null {
  const secretKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
  if (env.SUPABASE_URL && secretKey) return createSupabaseStore(env.SUPABASE_URL, secretKey)
  // Opt-in, local-only fallback so the UI can be exercised without a database.
  if (!isDeployed(env) && env.QUOTE_DEV_MEMORY_STORE === '1') return (devStore ??= createMemoryStore({ products: catalog, admins: ['dev_admin'] }))
  return null
}

/** Private bucket in the same Supabase project; in-memory files alongside the local memory store. */
function resolveFiles(env: NodeJS.ProcessEnv, store: DataStore | null): FileStorage | null {
  const secretKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
  if (env.SUPABASE_URL && secretKey) return createSupabaseFileStorage(createClient(env.SUPABASE_URL, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }))
  return store && store === devStore ? (devFiles ??= createMemoryFileStorage()) : null
}

let handlers: ReturnType<typeof createApiHandlers> | undefined

/** Handlers wired from server environment variables (never VITE_-prefixed secrets). */
export function getApiHandlers(env: NodeJS.ProcessEnv = process.env) {
  if (handlers) return handlers
  const hashSecret = env.QUOTE_HASH_SECRET ?? ''
  const store = hashSecret.length >= 32 ? resolveStore(env) : null
  if (!store) console.error('[quotes] store not configured (SUPABASE_URL, SUPABASE_SECRET_KEY, QUOTE_HASH_SECRET >= 32 chars)')
  if (isDeployed(env) && (!list(env.CLERK_AUTHORIZED_PARTIES).length || !list(env.ALLOWED_ORIGINS).length)) {
    console.error('[quotes] set CLERK_AUTHORIZED_PARTIES and ALLOWED_ORIGINS to the site origin in production')
  }

  // Published slugs from the database (cached briefly); bundled DEMO list when no database is configured.
  let cached: { at: number; slugs: Set<string> } | undefined
  const knownProducts = async () => {
    if (!store) return bundledSlugs
    if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return cached.slugs
    const slugs = new Set((await store.listProducts({ includeUnpublished: false })).map((p) => p.slug))
    cached = { at: Date.now(), slugs }
    return slugs
  }

  handlers = createApiHandlers({
    store,
    files: resolveFiles(env, store),
    knownProducts,
    onCatalogChange: () => {
      cached = undefined
    },
    hashSecret,
    verifyAuth: withDevAuth(
      env,
      createClerkVerifier({
        secretKey: env.CLERK_SECRET_KEY,
        jwtKey: env.CLERK_JWT_KEY,
        authorizedParties: list(env.CLERK_AUTHORIZED_PARTIES),
      }),
    ),
    directory: !isDeployed(env) && env.NOVARO_DEV_FAKE_AUTH === '1' ? withDevDirectory(createClerkDirectory(env.CLERK_SECRET_KEY)) : createClerkDirectory(env.CLERK_SECRET_KEY),
    humanCheck: env.TURNSTILE_SECRET_KEY ? createTurnstileCheck(env.TURNSTILE_SECRET_KEY) : undefined,
    allowedOrigins: list(env.ALLOWED_ORIGINS),
  })
  return handlers
}
