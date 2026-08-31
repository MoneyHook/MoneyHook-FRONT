import { describe, expect, it } from 'vitest'

import { getPaymentIconSource } from './payment-icon'

describe('getPaymentIconSource', () => {
  it.each([
    ['楽天カード', 'カード', '/payment-icons/card_rakuten.svg'],
    [' PayPay ', 'QRペイ', '/payment-icons/qr_paypay.svg'],
    ['PayPay', 'カード', '/payment-icons/card_paypay.svg'],
    ['PayPay銀行', '銀行', '/payment-icons/bank_paypay.svg'],
    ['Ａｕ Ｐａｙ', 'QR ペイ', '/payment-icons/qr_au_pay.svg'],
  ])('resolves %s for %s', (paymentName, paymentTypeName, expected) => {
    expect(getPaymentIconSource({ paymentName, paymentTypeName })).toBe(expected)
  })

  it.each([
    ['新しいカード', 'カード', '/payment-icons/generic_card.svg'],
    ['財布', '現金', '/payment-icons/generic_cash.svg'],
    ['新しい決済', 'QRペイ', '/payment-icons/generic_qr.svg'],
    ['普通預金', '銀行', '/payment-icons/generic_bank.svg'],
    ['振込先', '銀行振込', '/payment-icons/generic_transfer.svg'],
  ])('falls back to the generic %s icon', (paymentName, paymentTypeName, expected) => {
    expect(getPaymentIconSource({ paymentName, paymentTypeName })).toBe(expected)
  })

  it('leaves an icon unresolved when the payment type is unavailable', () => {
    expect(getPaymentIconSource({ paymentName: '未分類', paymentTypeName: null })).toBeNull()
  })
})
