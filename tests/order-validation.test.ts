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
    assert.equal(messages.name, 'Enter your full name (at least 2 characters).')
    assert.equal(messages.email, 'Enter your email address.')
    assert.match(messages.phone, /Enter a phone number using/)
    assert.equal(messages.address, 'Enter your street address (at least 10 characters).')
    assert.equal(messages.city, 'Enter your city (at least 2 characters).')
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
    assert.match(messages.phone, /digits, \+, spaces, parentheses, and hyphens/)
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
