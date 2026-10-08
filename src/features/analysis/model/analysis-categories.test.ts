import { describe, expect, it } from 'vitest'

import type {
  V1CategoriesResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import {
  buildAnalysisCategoriesViewModel,
  getSelectedCategory,
  getSelectedSubcategory,
  groupDailyCategorySeries,
  normalizeCategoryUrlState,
} from './analysis-categories'

const range = {
  startDate: '2026-03-01',
  endDate: '2026-08-31',
  label: '2026年3月1日 〜 2026年8月31日',
}

function transaction(
  id: string,
  date: string,
  time: string | null,
): V1TransactionResource {
  return {
    transaction_id: id,
    transaction_date: date,
    transaction_time: time,
    transaction_name: `取引${id}`,
    amount: 1_000,
    sign: -1,
    signed_amount: -1_000,
    category_id: '1',
    category_name: '食費',
    sub_category_id: '11',
    sub_category_name: '外食',
    fixed_flg: false,
    payment_id: null,
    payment_name: null,
  }
}

function response(): V1CategoriesResponse {
  const items = [
    ['交通', 80_000],
    ['医療', 40_000],
    ['住居', 150_000],
    ['食費', 180_000],
    ['娯楽', 70_000],
    ['日用品', 60_000],
    ['衣服', 20_000],
  ] as const
  const total = items.reduce((sum, [, amount]) => sum + amount, 0)

  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    total_expense_amount: total,
    category_list: items.map(([categoryName, amount], index) => ({
      category_id: String(index + 1),
      category_name: categoryName,
      expense_amount: amount,
      ratio: (amount / total) * 100,
      series: [
        { bucket: '2026-03-01', expense_amount: amount / 2 },
        { bucket: '2026-04-01', expense_amount: amount / 2 },
      ],
      sub_category_list:
        categoryName === '食費'
          ? [
              {
                sub_category_id: '12',
                sub_category_name: 'スーパー',
                expense_amount: 60_000,
                ratio: 0,
                series: [],
                transaction_list: [],
              },
              {
                sub_category_id: '11',
                sub_category_name: '外食',
                expense_amount: 120_000,
                ratio: 0,
                series: [],
                transaction_list: [],
              },
            ]
          : [],
      transaction_list:
        categoryName === '食費'
          ? [
              transaction('2', '2026-08-28', '12:30:00'),
              transaction('3', '2026-08-28', '18:45:00'),
              transaction('1', '2026-08-27', null),
            ]
          : [],
    })),
  }
}

describe('analysis categories model', () => {
  it('groups daily expenses by month and Monday-based weeks across month and year boundaries', () => {
    const daily = [
      { bucket: '2025-12-28', expense_amount: 100 },
      { bucket: '2025-12-29', expense_amount: 200 },
      { bucket: '2025-12-31', expense_amount: 300 },
      { bucket: '2026-01-01', expense_amount: 400 },
      { bucket: '2026-01-04', expense_amount: 500 },
      { bucket: '2026-01-05', expense_amount: 0 },
    ]
    expect(groupDailyCategorySeries(daily, 'month')).toEqual([
      { bucket: '2025-12-01', expense_amount: 600 },
      { bucket: '2026-01-01', expense_amount: 900 },
    ])
    expect(groupDailyCategorySeries(daily, 'week')).toEqual([
      { bucket: '2025-12-22', expense_amount: 100 },
      { bucket: '2025-12-29', expense_amount: 1400 },
      { bucket: '2026-01-05', expense_amount: 0 },
    ])
    expect(groupDailyCategorySeries(daily, 'day')).toEqual(daily)
    expect(daily[1].bucket).toBe('2025-12-29')
  })

  it('keeps zero-spending buckets and leap days when regrouping', () => {
    const daily = [
      { bucket: '2024-02-28', expense_amount: 0 },
      { bucket: '2024-02-29', expense_amount: 250 },
      { bucket: '2024-03-01', expense_amount: 0 },
    ]
    expect(groupDailyCategorySeries(daily, 'month')).toEqual([
      { bucket: '2024-02-01', expense_amount: 250 },
      { bucket: '2024-03-01', expense_amount: 0 },
    ])
    expect(groupDailyCategorySeries(daily, 'week')).toEqual([
      { bucket: '2024-02-26', expense_amount: 250 },
    ])
    expect(groupDailyCategorySeries([], 'month')).toEqual([])
  })

  it('sorts the hierarchy, builds top-five plus other, and orders transactions', () => {
    const model = buildAnalysisCategoriesViewModel(response(), range, 'month')

    expect(model.categories.map((category) => category.name)).toEqual([
      '食費',
      '住居',
      '交通',
      '娯楽',
      '日用品',
      '医療',
      '衣服',
    ])
    expect(model.topCategories.map((category) => category.name)).toEqual([
      '食費',
      '住居',
      '交通',
      '娯楽',
      '日用品',
      'その他',
    ])
    expect(model.topCategories.at(-1)).toMatchObject({
      amount: 60_000,
      selectable: false,
    })
    expect(model.categories[0].subcategories.map((item) => item.name)).toEqual([
      '外食',
      'スーパー',
    ])
    expect(model.categories[0].transactions.map((item) => item.id)).toEqual([
      '3',
      '2',
      '1',
    ])
    expect(model.categories[0].transactions[0].subcategoryId).toBe('11')
    expect(model.categories[0].series.map((item) => item.label)).toEqual([
      '3月',
      '4月',
    ])
  })

  it('selects a requested category or falls back to the largest category', () => {
    const model = buildAnalysisCategoriesViewModel(response(), range, 'week')

    expect(getSelectedCategory(model, '3')?.name).toBe('住居')
    expect(getSelectedCategory(model, 'missing')?.name).toBe('食費')
    expect(model.categories[0].series[0].label).toBe('3/1週')
  })

  it('selects a subcategory only when it belongs to the selected category', () => {
    const model = buildAnalysisCategoriesViewModel(response(), range, 'month')
    const category = getSelectedCategory(model, '4')

    expect(getSelectedSubcategory(category, '11')?.name).toBe('外食')
    expect(getSelectedSubcategory(category, 'missing')).toBeNull()
    expect(getSelectedSubcategory(category, null)).toBeNull()
    expect(getSelectedSubcategory(null, '11')).toBeNull()
  })

  it('normalizes unknown URL state to stable defaults', () => {
    expect(
      normalizeCategoryUrlState({
        group: 'quarter',
        listMode: 'expanded',
      }),
    ).toEqual({ group: 'month', listMode: 'top' })
    expect(
      normalizeCategoryUrlState({
        group: 'day',
        listMode: 'all',
      }),
    ).toEqual({ group: 'day', listMode: 'all' })
  })

  it('keeps an empty response stable', () => {
    const empty = response()
    empty.total_expense_amount = 0
    empty.category_list = []
    const model = buildAnalysisCategoriesViewModel(empty, range, 'month')

    expect(model.categories).toEqual([])
    expect(model.topCategories).toEqual([])
    expect(getSelectedCategory(model, null)).toBeNull()
  })
})
