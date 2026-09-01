import { describe, expect, it } from 'vitest'

import { createNewTransactionValues, validateNewTransaction } from './new-transaction'

describe('validateNewTransaction', () => {
  it('accepts API-compatible values', () => {
    expect(
      validateNewTransaction({
        ...createNewTransactionValues(new Date(2026, 7, 30)),
        amount: '1200',
        transactionName: 'ランチ',
        categoryId: '10',
        subcategoryId: '11',
      }),
    ).toEqual({})
  })

  it('rejects missing fields, invalid dates, and out-of-range amounts', () => {
    expect(
      validateNewTransaction({
        ...createNewTransactionValues(),
        transactionDate: '2026-02-30',
        amount: '10000000',
        transactionName: '',
      }),
    ).toEqual({
      transactionDate: '日付を選択してください。',
      amount: '金額は1〜9,999,999円の整数で入力してください。',
      transactionName: '取引名は1〜32文字で入力してください。',
      categoryId: 'カテゴリを選択してください。',
      subcategoryId: 'サブカテゴリを選択してください。',
    })
  })
})
