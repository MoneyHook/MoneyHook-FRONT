import { describe, expect, it } from 'vitest'

import {
  createRecurringTransactionValues,
  validateRecurringTransaction,
} from './recurring-transaction-settings'

const validValues = {
  amount: '5000',
  categoryId: '15',
  day: '10',
  paymentId: null,
  sign: -1 as const,
  subcategoryId: '18',
  transactionName: 'ジム',
}

describe('recurring transaction settings model', () => {
  it('creates an empty expense form', () => {
    expect(createRecurringTransactionValues()).toMatchObject({ sign: -1, paymentId: null })
  })

  it('accepts a complete recurring transaction', () => {
    expect(validateRecurringTransaction(validValues)).toEqual({})
  })

  it.each([
    ['amount', { amount: '0' }, '金額は1〜9,999,999円の整数で入力してください。'],
    ['amount', { amount: '100.5' }, '金額は1〜9,999,999円の整数で入力してください。'],
    ['day', { day: '32' }, '入力日は1〜31の整数で入力してください。'],
    ['transactionName', { transactionName: '' }, '取引名は1〜32文字で入力してください。'],
    ['categoryId', { categoryId: '' }, 'カテゴリを選択してください。'],
    ['subcategoryId', { subcategoryId: '' }, 'サブカテゴリを選択してください。'],
  ] as const)('validates %s', (field, patch, message) => {
    expect(validateRecurringTransaction({ ...validValues, ...patch })[field]).toBe(message)
  })
})
