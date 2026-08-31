import { describe, expect, it } from 'vitest'

import type {
  HomeResponse,
  V1BudgetResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'

import {
  buildHomeDashboardViewModel,
  createMonthContext,
  normalizeMonthParam,
} from './home-dashboard'

function overview(
  expenseAmount: number,
  series: V1OverviewResponse['series'],
): V1OverviewResponse {
  return {
    range: { start_date: series[0]?.bucket ?? '2026-08-01', end_date: '2026-08-31' },
    summary: {
      expense_amount: expenseAmount,
      income_amount: 0,
      net_amount: -expenseAmount,
      fixed_expense_amount: Math.round(expenseAmount / 2),
      variable_expense_amount: expenseAmount - Math.round(expenseAmount / 2),
      monthly_average_expense: expenseAmount,
    },
    series,
    category_changes: [],
  }
}

function home(categories: Array<[string, number]>): HomeResponse {
  return {
    balance: -categories.reduce((total, [, amount]) => total + amount, 0),
    category_list: categories.map(([category_name, amount]) => ({
      category_name,
      category_total_amount: -amount,
      sub_category_list: [],
    })),
  }
}

const fixed: V1FixedResponse = {
  range: { start_date: '2026-08-01', end_date: '2026-08-31' },
  summary: {
    expense_amount: 92_000,
    monthly_average: 92_000,
    annualized_amount: 1_104_000,
    total_expense_ratio: 49.9,
    latest_bucket_amount: 92_000,
    previous_bucket_amount: 0,
    difference_amount: 92_000,
    difference_rate: null,
  },
  series: [],
  category_list: [],
}

const budget: V1BudgetResponse = {
  monthly_budget_amount: 300_000,
  effective_from: '2026-08-01',
}

describe('home dashboard month helpers', () => {
  it('normalizes missing, invalid, and future months to the current month', () => {
    const now = new Date(2026, 7, 22)

    expect(normalizeMonthParam(null, now)).toBe('2026-08-01')
    expect(normalizeMonthParam('2026-8-01', now)).toBe('2026-08-01')
    expect(normalizeMonthParam('2026-09-01', now)).toBe('2026-08-01')
  })

  it('handles leap years, elapsed days, and the previous month boundary', () => {
    const current = createMonthContext('2026-08-01', new Date(2026, 7, 22))
    const leapMonth = createMonthContext('2024-02-01', new Date(2026, 7, 22))

    expect(current.elapsedDays).toBe(22)
    expect(current.remainingDays).toBe(9)
    expect(current.previousMonth).toBe('2026-07-01')
    expect(leapMonth.daysInMonth).toBe(29)
    expect(leapMonth.elapsedDays).toBe(29)
  })
})

describe('buildHomeDashboardViewModel', () => {
  it('builds cumulative pace, ratios, top categories, and changes', () => {
    const month = createMonthContext('2026-08-01', new Date(2026, 7, 22))
    const result = buildHomeDashboardViewModel({
      currentOverview: overview(184_320, [
        {
          bucket: '2026-08-01',
          expense_amount: 100_000,
          income_amount: 0,
          net_amount: -100_000,
          fixed_expense_amount: 50_000,
          variable_expense_amount: 50_000,
        },
        {
          bucket: '2026-08-22',
          expense_amount: 84_320,
          income_amount: 0,
          net_amount: -84_320,
          fixed_expense_amount: 42_160,
          variable_expense_amount: 42_160,
        },
      ]),
      previousOverview: overview(170_000, [
        {
          bucket: '2026-07-01',
          expense_amount: 170_000,
          income_amount: 0,
          net_amount: -170_000,
          fixed_expense_amount: 85_000,
          variable_expense_amount: 85_000,
        },
      ]),
      currentHome: home([
        ['食費', 52_400],
        ['住居', 45_000],
        ['交通', 21_300],
      ]),
      previousHome: home([
        ['食費', 40_000],
        ['住居', 45_000],
        ['交通', 25_000],
      ]),
      fixed,
      budget,
      month,
    })

    expect(result.differenceAmount).toBe(14_320)
    expect(result.pace[21]?.current).toBe(184_320)
    expect(result.pace[22]?.current).toBeNull()
    expect(result.categories.map((category) => category.name)).toEqual([
      '食費',
      '住居',
      '交通',
    ])
    expect(result.increase).toMatchObject({ name: '食費', difference: 12_400 })
    expect(result.decrease).toMatchObject({ name: '交通', difference: -3_700 })
    expect(result.dailyAverage).toBe(8_378)
    expect(result.budgetRatio).toBe(61.44)
  })

  it('keeps zero and empty responses stable', () => {
    const month = createMonthContext('2026-07-01', new Date(2026, 7, 22))
    const emptyOverview = overview(0, [])
    const result = buildHomeDashboardViewModel({
      currentOverview: emptyOverview,
      previousOverview: emptyOverview,
      currentHome: home([]),
      previousHome: home([]),
      fixed: { ...fixed, summary: { ...fixed.summary, expense_amount: 0 } },
      budget: { ...budget, monthly_budget_amount: null, effective_from: null },
      month,
    })

    expect(result.differenceRate).toBeNull()
    expect(result.categories).toEqual([])
    expect(result.increase).toBeNull()
    expect(result.decrease).toBeNull()
    expect(result.dailyAverage).toBe(0)
    expect(result.budgetRatio).toBeNull()
  })

  it('calculates the budget ratio from the configured monthly budget', () => {
    const month = createMonthContext('2026-08-01', new Date(2026, 7, 22))
    const result = buildHomeDashboardViewModel({
      currentOverview: overview(150_000, []),
      previousOverview: overview(0, []),
      currentHome: home([]),
      previousHome: home([]),
      fixed: { ...fixed, summary: { ...fixed.summary, expense_amount: 0 } },
      budget: { monthly_budget_amount: 100_000, effective_from: '2026-08-01' },
      month,
    })

    expect(result.budgetRatio).toBe(150)
  })
})
