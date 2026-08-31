import { describe, expect, it } from 'vitest'

import { getCategoryPresentation } from './category-presentation'

describe('getCategoryPresentation', () => {
  it('returns the presentation registered for an API master category', () => {
    expect(getCategoryPresentation('交通費')).toMatchObject({
      iconClassName: 'bg-chart-2/12 text-chart-2',
      dotClassName: 'bg-chart-2',
    })
  })

  it('supports names used by existing transaction data', () => {
    expect(getCategoryPresentation('住居')).toMatchObject({
      iconClassName: 'bg-success/12 text-success',
    })
  })

  it('uses the income presentation when the transaction sign is income', () => {
    expect(getCategoryPresentation('食費', { isIncome: true })).toMatchObject({
      iconClassName: 'bg-income/12 text-income',
      dotClassName: 'bg-income',
    })
  })

  it('falls back to the neutral presentation for an unknown category', () => {
    expect(getCategoryPresentation('未登録カテゴリ')).toMatchObject({
      iconClassName: 'bg-muted text-muted-foreground',
      dotClassName: 'bg-muted-foreground',
    })
  })
})
