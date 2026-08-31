import { describe, expect, it } from 'vitest'

import type {
  V1CategoriesResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'

import {
  buildAnalysisOverviewViewModel,
  createAnalysisRange,
} from './analysis-overview'

const range = createAnalysisRange(new Date(2026, 7, 30, 12))

function overview(): V1OverviewResponse {
  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    summary: {
      expense_amount: 600_000,
      income_amount: 0,
      net_amount: -600_000,
      fixed_expense_amount: 330_000,
      variable_expense_amount: 270_000,
      monthly_average_expense: 100_000,
    },
    series: [
      {
        bucket: '2026-03-01',
        expense_amount: 90_000,
        income_amount: 0,
        net_amount: -90_000,
        fixed_expense_amount: 50_000,
        variable_expense_amount: 40_000,
      },
      {
        bucket: '2026-08-01',
        expense_amount: 110_000,
        income_amount: 0,
        net_amount: -110_000,
        fixed_expense_amount: 60_000,
        variable_expense_amount: 50_000,
      },
    ],
    category_changes: [
      {
        category_id: '1',
        category_name: '食費',
        current_amount: 180_000,
        comparison_amount: 150_000,
        difference_amount: 30_000,
        difference_rate: 20,
      },
      {
        category_id: '2',
        category_name: '住居',
        current_amount: 150_000,
        comparison_amount: 150_000,
        difference_amount: 0,
        difference_rate: 0,
      },
      {
        category_id: '3',
        category_name: '娯楽',
        current_amount: 90_000,
        comparison_amount: 110_000,
        difference_amount: -20_000,
        difference_rate: -18.2,
      },
      {
        category_id: '4',
        category_name: '交通',
        current_amount: 80_000,
        comparison_amount: 90_000,
        difference_amount: -10_000,
        difference_rate: -11.1,
      },
      {
        category_id: '5',
        category_name: '日用品',
        current_amount: 60_000,
        comparison_amount: 50_000,
        difference_amount: 10_000,
        difference_rate: 20,
      },
      {
        category_id: '6',
        category_name: '医療',
        current_amount: 40_000,
        comparison_amount: 30_000,
        difference_amount: 10_000,
        difference_rate: 33.3,
      },
    ],
  }
}

function categories(): V1CategoriesResponse {
  const items = [
    ['食費', 180_000],
    ['住居', 150_000],
    ['娯楽', 90_000],
    ['交通', 80_000],
    ['日用品', 60_000],
    ['医療', 40_000],
  ] as const

  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    total_expense_amount: 600_000,
    category_list: items.map(([category_name, expense_amount], index) => ({
      category_id: String(index + 1),
      category_name,
      expense_amount,
      ratio: (expense_amount / 600_000) * 100,
      series: [],
      sub_category_list: [],
      transaction_list: [],
    })),
  }
}

function fixed(): V1FixedResponse {
  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    summary: {
      expense_amount: 330_000,
      monthly_average: 55_000,
      annualized_amount: 660_000,
      total_expense_ratio: 55,
      latest_bucket_amount: 60_000,
      previous_bucket_amount: 55_000,
      difference_amount: 5_000,
      difference_rate: 9.1,
    },
    series: [],
    category_list: [
      ['住居', 240_000],
      ['通信', 30_000],
      ['保険', 24_000],
      ['サブスク', 18_000],
      ['その他固定費', 12_000],
      ['会費', 6_000],
    ].map(([category_name, expense_amount], index) => ({
      category_id: String(index + 1),
      category_name: String(category_name),
      expense_amount: Number(expense_amount),
      ratio: (Number(expense_amount) / 330_000) * 100,
      monthly_average: Number(expense_amount) / 6,
      annualized_amount: Number(expense_amount) * 2,
      series: [],
      transaction_list: [],
    })),
  }
}

describe('analysis overview model', () => {
  it('creates a six-calendar-month range ending at the current month end', () => {
    expect(range).toEqual({
      startDate: '2026-03-01',
      endDate: '2026-08-31',
      label: '2026年3月1日 〜 2026年8月31日',
    })

    expect(createAnalysisRange(new Date(2026, 0, 10))).toMatchObject({
      startDate: '2025-08-01',
      endDate: '2026-01-31',
    })
  })

  it('builds summaries, grouped breakdowns, and ranked changes', () => {
    const model = buildAnalysisOverviewViewModel({
      overview: overview(),
      categories: categories(),
      fixed: fixed(),
      range,
    })

    expect(model.fixedExpenseRatio).toBeCloseTo(55)
    expect(model.variableExpenseRatio).toBeCloseTo(45)
    expect(model.series.map((item) => item.label)).toEqual(['3月', '8月'])
    expect(model.categories.map((item) => [item.name, item.amount])).toEqual([
      ['食費', 180_000],
      ['住居', 150_000],
      ['娯楽', 90_000],
      ['交通', 80_000],
      ['その他', 100_000],
    ])
    expect(model.fixedCategories.at(-1)).toMatchObject({
      name: 'その他',
      amount: 18_000,
    })
    expect(model.increases.map((item) => item.name)).toEqual(['食費', '日用品', '医療'])
    expect(model.decreases.map((item) => item.name)).toEqual(['娯楽', '交通'])
    expect(model.comparisonAmount).toBe(580_000)
    expect(model.differenceAmount).toBe(20_000)
    expect(model.differenceRate).toBeCloseTo(3.448)
  })

  it('keeps an empty response stable', () => {
    const emptyOverview = overview()
    emptyOverview.summary = {
      expense_amount: 0,
      income_amount: 0,
      net_amount: 0,
      fixed_expense_amount: 0,
      variable_expense_amount: 0,
      monthly_average_expense: 0,
    }
    emptyOverview.category_changes = []
    const emptyCategories = categories()
    emptyCategories.total_expense_amount = 0
    emptyCategories.category_list = []
    const emptyFixed = fixed()
    emptyFixed.summary.expense_amount = 0
    emptyFixed.category_list = []

    const model = buildAnalysisOverviewViewModel({
      overview: emptyOverview,
      categories: emptyCategories,
      fixed: emptyFixed,
      range,
    })

    expect(model.categories).toEqual([])
    expect(model.fixedCategories).toEqual([])
    expect(model.fixedExpenseRatio).toBe(0)
    expect(model.differenceRate).toBeNull()
  })
})
