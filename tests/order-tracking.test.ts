import assert from 'node:assert/strict'
import { test } from 'node:test'
import { customerTimeline, deliveryWindow, nextStatuses, progressOf } from '../src/features/orders/tracking.js'
import { orderMetrics } from '../src/features/orders/orderView.js'
import type { Order } from '../src/features/orders/schema.js'

test('admins can only move orders forward or cancel open ones', () => {
  assert.deepEqual(nextStatuses('processing'), ['shipped', 'out_for_delivery', 'delivered', 'cancelled'])
  assert.deepEqual(nextStatuses('delivered'), [])
  assert.deepEqual(nextStatuses('cancelled'), [])
  assert.equal(progressOf('placed'), 0)
  assert.equal(progressOf('delivered'), 1)
  assert.equal(progressOf('cancelled'), 0)
})

test('customer timeline keeps status changes and public notes only', () => {
  const t = customerTimeline('2026-10-01T10:00:00Z', [
    { kind: 'status', actor: 'user_admin', from: 'placed', to: 'confirmed', at: '2026-10-01T11:00:00Z', note: 'internal', public: false },
    { kind: 'update', actor: 'user_admin', from: 'confirmed', to: 'confirmed', at: '2026-10-01T12:00:00Z', note: 'Packing tomorrow', public: true },
    { kind: 'update', actor: 'user_admin', from: 'confirmed', to: 'confirmed', at: '2026-10-01T13:00:00Z' },
  ])
  assert.deepEqual(t, [
    { status: 'placed', at: '2026-10-01T10:00:00Z' },
    { status: 'confirmed', at: '2026-10-01T11:00:00Z' },
    { status: 'confirmed', at: '2026-10-01T12:00:00Z', note: 'Packing tomorrow' },
  ])
})

test('delivery window prefers the scheduled date', () => {
  assert.deepEqual(deliveryWindow('2026-10-01T00:00:00Z', '2026-10-05'), { earliest: '2026-10-05', latest: '2026-10-05', exact: true })
  const w = deliveryWindow('2026-10-01T00:00:00Z')
  assert.equal(w.exact, false)
  assert.equal(w.earliest.slice(0, 10), '2026-10-03')
  assert.equal(w.latest.slice(0, 10), '2026-10-05')
})

test('metrics count collected revenue from delivered orders only', () => {
  const now = Date.parse('2026-10-19T12:00:00Z')
  const base = { id: 'x', reference: 'VEL-X', customer: { name: 'A', email: 'a@x.test', phone: '1', address: 'addr', city: 'Lahore', country: 'Pakistan' as const }, items: [], subtotal: 100, delivery: 300, currency: 'PKR' }
  const orders: Order[] = [
    { ...base, id: '1', total: 1000, status: 'delivered', created_at: '2026-10-18T10:00:00Z' },
    { ...base, id: '2', total: 500, status: 'shipped', created_at: '2026-10-17T10:00:00Z' },
    { ...base, id: '3', total: 900, status: 'cancelled', created_at: '2026-10-16T10:00:00Z' },
    { ...base, id: '4', total: 300, status: 'placed', created_at: '2026-10-01T10:00:00Z' },
  ]
  const m = orderMetrics(orders, now)
  assert.equal(m.collected, 1000)
  assert.equal(m.open, 2)
  assert.equal(m.openValue, 800)
  assert.equal(m.averageValue, 600)
  assert.equal(m.last7, 2)
  assert.equal(m.prev7, 0)
  assert.equal(m.daily.length, 14)
  assert.equal(m.daily.at(-1)?.day, '2026-10-19')
  assert.equal(m.daily.reduce((s, d) => s + d.value, 0), 2)
})
