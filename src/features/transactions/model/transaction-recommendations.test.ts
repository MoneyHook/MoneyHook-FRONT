import { describe, expect, it } from 'vitest'

import { createNewTransactionValues } from './new-transaction'
import {
  applyTransactionRecommendation,
  createTransactionRecommendationIndex,
  getTransactionRecommendations,
  normalizeTransactionName,
} from './transaction-recommendations'

const candidate = (transaction_name: string) => ({
  transaction_name,
  category_id: '10',
  category_name: '食費',
  sub_category_id: '11',
  sub_category_name: '外食',
  fixed_flg: false,
  payment_id: null,
})

describe('transaction recommendations', () => {
  it('normalizes width, case, kana and whitespace without changing display names', () => {
    expect(normalizeTransactionName(' ＡＢＣ　ｶﾞｽ\t')).toBe('abcがす')
    const transactions = [candidate('ＡＢＣ ガス')]
    expect(
      getTransactionRecommendations(
        createTransactionRecommendationIndex(transactions),
        'abcがす',
      ),
    ).toEqual(transactions)
    expect(transactions[0].transaction_name).toBe('ＡＢＣ ガス')
  })

  it('ranks exact, prefix and substring matches stably without mutating the source', () => {
    const names = [
      '朝ランチ',
      'ランチ 渋谷',
      'ランチ',
      'ランチ 新宿',
      '夜ランチ',
      '夕食',
    ]
    const transactions = names.map(candidate)
    expect(
      getTransactionRecommendations(
        createTransactionRecommendationIndex(transactions),
        'らんち',
      ).map((item) => item.transaction_name),
    ).toEqual(['ランチ', 'ランチ 渋谷', 'ランチ 新宿', '朝ランチ', '夜ランチ'])
    expect(transactions.map((item) => item.transaction_name)).toEqual(names)
  })

  it.each(['ディナー', 'ランテ', 'ランチセット'])(
    'returns no matches for %j',
    (input) => {
      expect(
        getTransactionRecommendations(
          createTransactionRecommendationIndex([candidate('ランチ')]),
          input,
        ),
      ).toEqual([])
    },
  )

  it.each(['', ' 　\t'])('returns the top six in API order for %j', (input) => {
    const transactions = Array.from({ length: 10 }, (_, index) =>
      candidate(`候補${index}`),
    )
    expect(
      getTransactionRecommendations(
        createTransactionRecommendationIndex(transactions),
        input,
      ),
    ).toEqual(transactions.slice(0, 6))
  })

  it('returns no recommendations when history is empty', () => {
    expect(getTransactionRecommendations([], '')).toEqual([])
    expect(getTransactionRecommendations([], 'ランチ')).toEqual([])
  })

  it('accepts one character and limits recommendations to six', () => {
    const transactions = Array.from({ length: 20 }, (_, index) =>
      candidate(`候補${index}`),
    )
    expect(
      getTransactionRecommendations(
        createTransactionRecommendationIndex(transactions),
        '候',
      ),
    ).toEqual(transactions.slice(0, 6))
  })

  it('reuses a normalized index without mutating the source data', () => {
    const transactions = [candidate('ＡＢＣ ガス'), candidate('ランチ')]
    const index = createTransactionRecommendationIndex(transactions)

    expect(getTransactionRecommendations(index, 'abc')).toEqual([
      transactions[0],
    ])
    expect(getTransactionRecommendations(index, 'らん')).toEqual([
      transactions[1],
    ])
    expect(transactions.map((item) => item.transaction_name)).toEqual([
      'ＡＢＣ ガス',
      'ランチ',
    ])
  })
})

describe('applying transaction recommendations', () => {
  const form = {
    ...createNewTransactionValues(new Date(2026, 9, 2), 'default-payment'),
    transactionTime: '12:30',
    amount: '980',
    sign: 1 as const,
  }
  const transaction = {
    ...candidate('ランチ'),
    fixed_flg: true,
    payment_id: 'recommended-payment',
  }

  it('fills related fields while preserving date, time, amount and sign', () => {
    expect(applyTransactionRecommendation(form, transaction, {})).toEqual({
      ...form,
      transactionName: 'ランチ',
      categoryId: '10',
      subcategoryId: '11',
      subcategoryName: '',
      fixed: true,
      paymentId: 'recommended-payment',
    })
    expect(form.paymentId).toBe('default-payment')
    expect(form.transactionName).toBe('')
  })

  it('preserves manually selected categories and a new subcategory together', () => {
    const edited = {
      ...form,
      categoryId: '20',
      subcategoryId: '',
      subcategoryName: '新しいサブカテゴリ',
    }
    expect(
      applyTransactionRecommendation(edited, transaction, { category: true }),
    ).toEqual({
      ...edited,
      transactionName: 'ランチ',
      fixed: true,
      paymentId: 'recommended-payment',
    })
  })

  it('preserves explicit false and no-payment selections', () => {
    const edited = { ...form, paymentId: null, fixed: false }
    const result = applyTransactionRecommendation(edited, transaction, {
      fixed: true,
      payment: true,
    })
    expect(result.fixed).toBe(false)
    expect(result.paymentId).toBeNull()
    expect(result.categoryId).toBe('10')
  })

  it('allows switching recommendations without treating autofill as a manual edit', () => {
    const first = applyTransactionRecommendation(form, transaction, {})
    const second = applyTransactionRecommendation(
      first,
      { ...candidate('夕食'), category_id: '30', payment_id: null },
      {},
    )
    expect(second.transactionName).toBe('夕食')
    expect(second.categoryId).toBe('30')
    expect(second.paymentId).toBeNull()
    expect(second.fixed).toBe(false)
  })
})
