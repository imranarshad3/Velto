import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productPhotoLayout } from '../src/features/catalog/productPhotoLayout.ts'

test('automatic sizing preserves portrait, landscape and square proportions without enlargement', () => {
  for (const [width, height] of [[1085, 1449], [4000, 2000], [300, 400], [1600, 1600], [40, 4000]]) {
    const out = productPhotoLayout(width, height)
    assert.ok(out.width <= 1600 && out.height <= 1600)
    assert.ok(out.width <= width && out.height <= height, 'never upscale the source')
    const scale = Math.min(out.width / width, out.height / height)
    assert.ok(Math.abs(out.width - width * scale) < 1 && Math.abs(out.height - height * scale) < 1, 'preserve proportions to rounding precision')
  }
  assert.deepEqual(productPhotoLayout(1085, 1449), { width: 1085, height: 1449 })
  assert.deepEqual(productPhotoLayout(4000, 3000), { width: 1600, height: 1200 })
  assert.deepEqual(productPhotoLayout(320, 240), { width: 320, height: 240 })
})

test('invalid dimensions and oversized decoded photos are rejected', () => {
  for (const [w, h] of [[0, 100], [NaN, 100], [100, Infinity], [10000, 10000]]) {
    assert.throws(() => productPhotoLayout(w, h))
  }
})
