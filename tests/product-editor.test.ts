import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productInputSchema } from '../src/features/catalog/productSchema.js'
import { aiProductDraftSchema } from '../src/features/catalog/aiProduct.js'
import { parseQuery, filterAndSort, productCategories } from '../src/features/catalog/catalogQuery.js'
const image = { src: '/images/products/testing-grout.webp', alt: 'Product', width: 1024, height: 1024 }
const product = { slug: 'new-product', name: 'New product', categorySlug: 'custom-coatings', categoryName: 'Custom Coatings', usage: 'For exterior surfaces', price: { amount: 1200, currency: 'PKR' }, stockQuantity: 12, images: Array.from({length: 8}, () => image) }
test('product editor accepts eight gallery images and custom categories; rejects nine or unsafe URLs', () => {
  assert.equal(productInputSchema.safeParse(product).success, true)
  assert.equal(productInputSchema.safeParse({...product, images: [...product.images, image]}).success, false)
  assert.equal(productInputSchema.safeParse({...product, images: [{...image, src: 'https://other.example/a.png'}]}).success, false)
})
test('selling price is mandatory, positive and always PKR; inventory is a nonnegative integer', () => {
  for (const price of [undefined, null, {amount: 0, currency: 'PKR'}, {amount: 100, currency: 'USD'}]) assert.equal(productInputSchema.safeParse({...product,price}).success, false)
  for (const stockQuantity of [-1,1.5]) assert.equal(productInputSchema.safeParse({...product,stockQuantity}).success, false)
  assert.equal(productInputSchema.safeParse({...product,stockQuantity:0}).success, true)
})
test('custom category filters survive URL parsing and are exposed to shoppers', () => {
  const products = [{...product, id: 'test', verified: true, applications: [], areas: []}]
  const q = parseQuery(new URLSearchParams('category=custom-coatings'))
  assert.deepEqual(q.categories, ['custom-coatings'])
  assert.equal(filterAndSort(products,q).length,1)
  assert.equal(productCategories(products).find(c=>c.value==='custom-coatings')?.label,'Custom Coatings')
})
test('AI can suggest custom categories without assigning stock or price', () => {
  const draft = {name:'Coating',slug:'coating',categorySlug:'custom-coatings',categoryName:'Custom Coatings',usage:'',description:'',applications:[],areas:[],benefits:[],specifications:[],packSizes:[],coverage:'',faq:[],imageAlt:'',confidence:'low',observations:[],reviewNotes:[],missingInformation:[]}
  assert.equal(aiProductDraftSchema.safeParse(draft).success,true)
  assert.equal(aiProductDraftSchema.safeParse({...draft,stockQuantity:100}).success,false)
})
