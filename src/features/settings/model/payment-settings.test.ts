import { describe, expect, it } from 'vitest'

import type { PaymentTypeListResponsePaymentTypeListItem } from '@/shared/api/generated/model'

import { validatePaymentSettings } from './payment-settings'

const cardType: PaymentTypeListResponsePaymentTypeListItem = {
  is_payment_due_later: true,
  payment_type_id: '2',
  payment_type_name: 'カード',
}

describe('validatePaymentSettings', () => {
  it('requires a non-empty payment name no longer than 32 characters', () => {
    expect(validatePaymentSettings({ closingDate: '', paymentDate: '', paymentName: ' ', paymentTypeId: '1' }, undefined)).toMatchObject({
      paymentName: '支払い方法名を入力してください。',
      paymentTypeId: '支払いの種類を選択してください。',
    })
    expect(validatePaymentSettings({ closingDate: '', paymentDate: '', paymentName: 'あ'.repeat(33), paymentTypeId: '1' }, undefined)).toMatchObject({
      paymentName: '支払い方法名は32文字以内で入力してください。',
    })
  })

  it('requires valid billing days for a payment-due-later type', () => {
    expect(validatePaymentSettings({ closingDate: '0', paymentDate: '32', paymentName: 'カード', paymentTypeId: '2' }, cardType)).toEqual({
      closingDate: '締め日は1〜31の整数で入力してください。',
      paymentDate: '支払日は1〜31の整数で入力してください。',
    })
  })
})
