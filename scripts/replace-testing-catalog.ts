/** Explicit, server-only maintenance task. Run with Node 24 and --apply after assets are deployed. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { catalog } from '../src/data/catalog.ts'

if (catalog.some((p) => p.verified || p.price)) throw new Error('Approved prices exist; the testing reset is no longer applicable.')
if (!process.argv.includes('--apply')) throw new Error('Pass --apply to replace the testing catalog.')
if (new URL(process.env.SUPABASE_URL ?? '').hostname !== 'flszrsxbmddnrjhfpjnl.supabase.co') throw new Error('Unexpected project; replacement stopped.')
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const actor = 'maintenance:testing-catalog'
const previous = await db.from('products').select('*')
if (previous.error) throw new Error(previous.error.code)
mkdirSync('backups', { recursive: true })
const backup = `backups/catalog-before-testing-${Date.now()}.json`
writeFileSync(backup, JSON.stringify(previous.data, null, 2), { mode: 0o600 })

// Publish the complete replacement before removing any existing products.
for (const [i, p] of catalog.entries()) {
  const { data, error } = await db.rpc('admin_save_product', {
    p_actor: actor, p_slug: p.slug, p_create: !previous.data.some((r) => r.slug === p.slug),
    p_product: { name: p.name, category_slug: p.categorySlug, usage: p.usage,
      description: p.description, applications: p.applications, areas: p.areas,
      benefits: [], specifications: [], pack_sizes: [], coverage: null, documents: [], faq: [],
      image: p.image, price_amount: null, price_currency: null, verified: false, published: true, sort_order: i },
  })
  if (error || data !== true) throw new Error(`Save failed: ${p.slug} (${error?.code})`)
}
const keep = new Set(catalog.map((p) => p.slug))
let deleted = 0, archived = 0
for (const p of previous.data.filter((p) => !keep.has(p.slug))) {
  const { data, error } = await db.rpc('admin_delete_product', { p_actor: actor, p_slug: p.slug })
  if (error) throw new Error(`Delete failed: ${error.code}`)
  if (data === 'in_use') {
    const result = await db.rpc('admin_set_product_status', { p_actor: actor, p_slug: p.slug, p_status: 'archived' })
    if (result.error || result.data !== true) throw new Error(`Archive failed: ${p.slug}`)
    archived++
  } else if (data === 'ok') deleted++
}
const result = await db.from('products').select('slug,verified,image').eq('published', true)
if (result.error || result.data?.length !== catalog.length || result.data.some((p) => !keep.has(p.slug) || p.verified)) throw new Error('Catalog verification failed')
console.log(JSON.stringify({ published: result.data.length, deleted, archived, backup }))
