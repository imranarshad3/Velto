import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { imageFrameStyle, imageSizeStyle, sizeContentImages, validImageDimension } from '../src/features/cms/imageSizing.js'
import { defaultContent } from '../src/features/cms/registry.js'
import { validContent } from '../src/features/cms/schema.js'
import { addSection, removeSection } from '../src/features/cms/sections.js'

describe('CMS image sizing', () => {
  it('fills fixed art-directed frames even when saved CMS sizing would leave empty bands', () => {
    assert.deepEqual(imageFrameStyle, { width: '100%', height: '100%', maxWidth: '100%', aspectRatio: 'auto' })
  })
  it('accepts bounded relative lengths and rejects unsafe or unsupported values', () => {
    for (const value of ['', '0.25rem', '24rem', '120rem', '100%', '50.5%']) assert.ok(validImageDimension(value, 'width'), value)
    for (const value of ['0rem', '-2rem', '121rem', '101%', 'NaNrem', '20px', 'calc(100% + 1rem)', '1rem;display:none']) assert.equal(validImageDimension(value, 'width'), false, value)
    assert.equal(validImageDimension('50%', 'height'), false)
    assert.equal(imageSizeStyle({ width: '', height: '' }), undefined)
    assert.equal(imageSizeStyle({ width: '999rem', height: '' }), undefined)
    assert.deepEqual(imageSizeStyle({ width: '24rem', height: '' }), { width: '24rem', maxWidth: '100%', height: 'auto', aspectRatio: 'auto' })
    assert.equal(imageSizeStyle({ width: '100%', height: '18rem' })?.height, '18rem')
  })

  it('allows dimensions only for known image fields, including custom sections', () => {
    const original = defaultContent('home')
    assert.ok(validContent('home', original))
    assert.ok(validContent('home', { ...original, imageSizes: { 'Hero.image-src': { width: '100%', height: '30rem' } } }))
    for (const key of ['unknown', 'Hero.field-1']) {
      assert.equal(validContent('home', { ...original, imageSizes: { [key]: { width: '24rem', height: '' } } }), null)
    }
    const sanitized = validContent('home', { ...original, imageSizes: { ['__proto__']: { width: '24rem', height: '' } } })
    assert.ok(!sanitized || !Object.hasOwn(sanitized.imageSizes ?? {}, '__proto__'), 'prototype keys are rejected or discarded')
    assert.equal(validContent('home', { ...original, imageSizes: { 'Hero.image-src': { width: '24px', height: '' } } }), null)
    const section = { id: `custom-${crypto.randomUUID()}`, type: 'image-text' as const }
    const draft = addSection(original, section)
    draft.imageSizes = { [`${section.id}.image-src`]: { width: '75%', height: '20rem' } }
    assert.ok(validContent('home', draft))
    const removed = removeSection(draft, section.id)
    assert.deepEqual(removed.imageSizes, {})
    assert.ok(validContent('home', removed))
  })

  it('sizes collection images by field identity without mutating source data', () => {
    const original = [{ image: { src: '/shared.webp', width: 600, height: 400 } }, { image: { src: '/shared.webp', width: 600, height: 400 } }]
    const size = { width: '50%', height: '12rem' }
    const result = sizeContentImages(original, 'Gallery.data', { 'Gallery.data.0.image.src': size })
    assert.deepEqual(result[0].image, { ...original[0].image, displaySize: size })
    assert.deepEqual(result[1], original[1])
    assert.ok(!('displaySize' in original[0].image))
    assert.equal(result[0].image.width, 600, 'intrinsic dimensions remain intact')
  })

  it('drops retired fields from content saved before their removal, but still rejects unknown ones', () => {
    const original = defaultContent('home')
    const saved = validContent('home', { ...original, fields: { ...original.fields, 'FeaturedProducts.field-7': 'Old demo notice' } })
    assert.ok(saved)
    assert.ok(!('FeaturedProducts.field-7' in saved.fields))
    assert.equal(validContent('home', { ...original, fields: { ...original.fields, 'FeaturedProducts.field-99': 'x' } }), null)
  })
})
