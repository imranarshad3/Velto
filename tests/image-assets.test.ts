import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveImageAsset } from '../src/data/images.js'

describe('refreshed storefront artwork', () => {
  it('refreshes cached local URLs and stale CMS dimensions without changing the saved object', () => {
    const saved = { src: '/images/categories/tile-adhesives.webp', width: 366, height: 234, alt: 'Tile adhesive' }
    const resolved = resolveImageAsset(saved)
    assert.equal(resolved.src, '/images/categories/tile-adhesives.webp?v=20261020')
    assert.deepEqual([resolved.width, resolved.height], [1536, 1024])
    assert.deepEqual([saved.width, saved.height], [366, 234])
    assert.equal(resolved.alt, saved.alt)
  })

  it('keeps uploaded and unrelated assets unchanged', () => {
    for (const src of ['https://example.com/customer-upload.webp?token=example', '/images/hero/hero-architecture.webp']) {
      const uploaded = { src, width: 900, height: 1200, alt: 'Custom image' }
      assert.equal(resolveImageAsset(uploaded), uploaded)
    }
  })

  it('keeps the contractor banner landscape proportions', () => {
    const resolved = resolveImageAsset({ src: '/images/banners/professional-contractor.webp', width: 420, height: 430, alt: '' })
    assert.deepEqual([resolved.width, resolved.height], [1672, 941])
    assert.match(resolved.src, /\?v=20261020$/)
  })
})
