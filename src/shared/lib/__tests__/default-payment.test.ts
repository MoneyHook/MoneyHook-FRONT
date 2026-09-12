import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PAYMENT_STORAGE_KEY,
  clearDefaultPaymentId,
  readDefaultPaymentId,
  writeDefaultPaymentId,
} from '../default-payment'

describe('default payment', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and clears a payment ID', () => {
    writeDefaultPaymentId('payment-1')

    expect(readDefaultPaymentId()).toBe('payment-1')

    clearDefaultPaymentId()

    expect(readDefaultPaymentId()).toBeNull()
  })

  it('discards an invalid stored value', () => {
    localStorage.setItem(
      DEFAULT_PAYMENT_STORAGE_KEY,
      JSON.stringify({ version: 1, value: '' }),
    )

    expect(readDefaultPaymentId()).toBeNull()
    expect(localStorage.getItem(DEFAULT_PAYMENT_STORAGE_KEY)).toBeNull()
  })
})
