import { describe, expect, it } from 'vitest'

import type {
  V1FixedResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import {
  buildAnalysisFixedViewModel,
  buildFixedBreakdown,
  normalizeFixedCategorySelection,
} from './analysis-fixed'
import { createAnalysisRange } from './analysis-overview'

const range = createAnalysisRange(new Date(2026, 7, 30, 12))

function transaction(
  id: string,
  overrides: Partial<V1TransactionResource> = {},
): V1TransactionResource {
  return {
    transaction_id: id,
    transaction_date: '2026-08-27',
    transaction_time: '08:00:00',
    transaction_name: `固定費${id}`,
    amount: 10_000,
    sign: -1,
    signed_amount: -10_000,
    category_id: '1',
    category_name: '住居',
    sub_category_id: '11',
    sub_category_name: '家賃',
    fixed_flg: true,
    payment_id: '20',
    payment_name: '楽天カード',
    ...overrides,
  }
}

function response(): V1FixedResponse {
  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    summary: {
      expense_amount: 360_000,
      monthly_average: 60_000,
      annualized_amount: 720_000,
      total_expense_ratio: 50,
      latest_bucket_amount: 62_000,
      previous_bucket_amount: 60_000,
      difference_amount: 2_000,
      difference_rate: 3.3,
    },
    series: [
      { bucket: '2026-03-01', expense_amount: 58_000 },
      { bucket: '2026-08-01', expense_amount: 62_000 },
    ],
    category_list: [
      {
        category_id: '2',
        category_name: '通信',
        expense_amount: 60_000,
        ratio: 16.7,
        monthly_average: 10_000,
        annualized_amount: 120_000,
        series: [
          { bucket: '2026-03-01', expense_amount: 9_000 },
          { bucket: '2026-08-01', expense_amount: 11_000 },
        ],
        transaction_list: [
          transaction('2', {
            transaction_date: '2026-08-28',
            transaction_time: '07:30:00',
            category_id: '2',
            category_name: '通信',
          }),
        ],
      },
      {
        category_id: '1',
        category_name: '住居',
        expense_amount: 300_000,
        ratio: 83.3,
        monthly_average: 50_000,
        annualized_amount: 600_000,
        series: [
          { bucket: '2026-03-01', expense_amount: 49_000 },
          { bucket: '2026-08-01', expense_amount: 51_000 },
        ],
        transaction_list: [
          transaction('10'),
          transaction('2', {
            transaction_date: '2026-08-28',
            transaction_time: '07:30:00',
            category_id: '2',
            category_name: '通信',
          }),
          transaction('1', { transaction_time: null }),
        ],
      },
    ],
  }
}

describe('analysis fixed model', () => {
  it('builds sorted categories, monthly series, and unique transactions', () => {
    const model = buildAnalysisFixedViewModel(response(), range)

    expect(model.monthlyAverage).toBe(60_000)
    expect(model.annualizedAmount).toBe(720_000)
    expect(model.differenceRate).toBe(3.3)
    expect(model.series.map((item) => item.label)).toEqual(['3月', '8月'])
    expect(model.categories.map((category) => category.name)).toEqual([
      '住居',
      '通信',
    ])
    expect(model.categories[0]).toMatchObject({
      monthlyAverage: 50_000,
      annualizedAmount: 600_000,
    })
    expect(model.transactions.map((item) => item.id)).toEqual(['2', '10', '1'])
    expect(model.transactions[0]).toMatchObject({
      categoryId: '2',
      categoryName: '通信',
    })
  })

  it('normalizes URL state and keeps at least one category selected', () => {
    const model = buildAnalysisFixedViewModel(response(), range)

    expect(normalizeFixedCategorySelection(model.categories, [])).toEqual([
      '1',
      '2',
    ])
    expect(
      normalizeFixedCategorySelection(model.categories, ['invalid', '2', '2']),
    ).toEqual(['2'])
    expect(
      normalizeFixedCategorySelection(model.categories, ['invalid']),
    ).toEqual(['1', '2'])
  })

  it('recalculates the selected-category breakdown', () => {
    const model = buildAnalysisFixedViewModel(response(), range)
    const breakdown = buildFixedBreakdown(model, ['2'])

    expect(breakdown.amount).toBe(60_000)
    expect(breakdown.categories).toHaveLength(1)
    expect(breakdown.categories[0].ratio).toBe(100)
  })

  it('keeps empty data and a null comparison rate stable', () => {
    const empty = response()
    empty.summary = {
      expense_amount: 0,
      monthly_average: 0,
      annualized_amount: 0,
      total_expense_ratio: 0,
      latest_bucket_amount: 0,
      previous_bucket_amount: 0,
      difference_amount: 0,
      difference_rate: null,
    }
    empty.category_list = []
    empty.series = []

    const model = buildAnalysisFixedViewModel(empty, range)

    expect(model.categories).toEqual([])
    expect(model.transactions).toEqual([])
    expect(model.differenceRate).toBeNull()
    expect(normalizeFixedCategorySelection(model.categories, ['1'])).toEqual(
      [],
    )
  })
})
