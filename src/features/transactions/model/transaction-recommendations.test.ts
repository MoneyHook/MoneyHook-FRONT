import { describe, expect, it } from 'vitest'

import {
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

  it.each(['', ' 　\t', 'ディナー', 'ランテ', 'ランチセット'])(
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
