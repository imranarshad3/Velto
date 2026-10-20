import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { orderInput } from '../src/features/orders/schema.js'

describe('checkout validation messages', () => {
  it('explains how to fix each missing delivery detail', () => {
    const result = orderInput.shape.customer.safeParse({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Pakistan',
    })

    assert.equal(result.success, false)
    if (result.success) return
    const messages = Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
    assert.equal(messages.name, 'Please enter your full name.')
    assert.equal(messages.email, 'Enter your email address.')
    assert.equal(messages.phone, 'Please enter a phone number we can reach you on.')
    assert.equal(messages.address, 'Please enter your delivery address.')
    assert.equal(messages.city, 'Please enter your city name.')
  })

  it('gives a useful example for malformed email and phone values', () => {
    const result = orderInput.shape.customer.safeParse({
      name: 'Ayesha Khan',
      email: 'not-an-email',
      phone: '0300-call-me',
      address: '12 Garden Town Road',
      city: 'Lahore',
      country: 'Pakistan',
    })

    assert.equal(result.success, false)
    if (result.success) return
    const messages = Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
    assert.match(messages.email, /name@example\.com/)
    assert.match(messages.phone, /0300 1234567/)
  })

  it('explains what is missing from an incomplete delivery address', () => {
    const result = orderInput.shape.customer.shape.address.safeParse('House 12')
    assert.equal(result.success, false)
    if (!result.success) assert.match(result.error.issues[0].message, /house or building number, street and area/)
  })

  it('accepts a valid Pakistan delivery address and phone number', () => {
    const result = orderInput.shape.customer.safeParse({
      name: 'Ayesha Khan',
      email: 'ayesha@example.com',
      phone: '+92 300 1234567',
      address: '12 Garden Town Road',
      city: 'Lahore',
      country: 'Pakistan',
    })

    assert.equal(result.success, true)
  })
})
