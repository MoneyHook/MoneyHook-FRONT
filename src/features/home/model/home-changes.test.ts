import { describe, expect, it } from 'vitest'

import type {
  V1CategoriesResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import {
  buildHomeChangesViewModel,
  createHomeChangeParameters,
} from './home-changes'
import { createMonthContext } from './home-dashboard'

function transaction(
  amount: number,
  overrides: Partial<V1TransactionResource> = {},
): V1TransactionResource {
  return {
    transaction_id: '1',
    transaction_date: '2026-10-01',
    transaction_time: null,
    transaction_name: '支出',
    amount,
    sign: -1,
    signed_amount: -amount,
    category_id: '1',
    category_name: '食費',
    sub_category_id: '1',
    sub_category_name: '食料品',
    fixed_flg: false,
    payment_id: null,
    payment_name: null,
    ...overrides,
  }
}

function categories(
  transactions: V1TransactionResource[],
): V1CategoriesResponse {
  const ids = [...new Set(transactions.map((item) => item.category_id))]
  return {
    range: { start_date: '2026-10-01', end_date: '2026-10-10' },
    total_expense_amount: 0,
    category_list: ids.map((id) => {
      const items = transactions.filter((item) => item.category_id === id)
      return {
        category_id: id,
        category_name: items[0].category_name,
        expense_amount: 0,
        ratio: 0,
        series: [],
        sub_category_list: [
          {
            sub_category_id: '1',
            sub_category_name: '食料品',
            expense_amount: 0,
            ratio: 0,
            series: [],
            transaction_list: items,
          },
        ],
        transaction_list: items,
      }
    }),
  }
}

const normalMonth = createMonthContext('2026-10-01', new Date(2026, 9, 7))
const earlyMonth = createMonthContext('2026-10-01', new Date(2026, 9, 6))

function changes(current: number, previous: number, month = normalMonth) {
  return buildHomeChangesViewModel(
    categories([transaction(current)]),
    categories([transaction(previous)]),
    month,
  )
}

describe('home change comparison periods', () => {
  it.each([
    ['2026-10-01', new Date(2026, 9, 10), '2026-10-10', '2026-09-10'],
    ['2026-03-01', new Date(2026, 2, 31), '2026-03-31', '2026-02-28'],
    ['2024-03-01', new Date(2024, 2, 30), '2024-03-30', '2024-02-29'],
    ['2026-01-01', new Date(2026, 0, 2), '2026-01-02', '2025-12-02'],
    ['2026-02-01', new Date(2026, 9, 2), '2026-02-28', '2026-01-31'],
  ])(
    'compares %s using the correct month boundaries',
    (month, now, end, previousEnd) => {
      const parameters = createHomeChangeParameters(
        createMonthContext(month, now),
      )
      expect(parameters.current).toEqual({
        start_date: month,
        end_date: end,
        group_by: 'month',
      })
      expect(parameters.previous).toEqual({
        start_date: `${previousEnd.slice(0, 7)}-01`,
        end_date: previousEnd,
        group_by: 'month',
      })
    },
  )
})

describe('home variable expense changes', () => {
  it.each([
    [18_000, 15_000, 3_000],
    [12_000, 15_000, -3_000],
    [24_000, 20_000, 4_000],
    [16_000, 20_000, -4_000],
  ])(
    'includes threshold boundary %i versus %i',
    (current, previous, difference) => {
      const result = changes(current, previous)
      expect(result?.increase ?? result?.decrease).toMatchObject({ difference })
    },
  )

  it.each([
    [17_999, 15_000],
    [20_001, 25_000],
    [400, 200],
    [32_999, 30_000],
  ])(
    'suppresses changes below either threshold: %i versus %i',
    (current, previous) => expect(changes(current, previous)).toBeNull(),
  )

  it('only allows large increases during days 1–6, then applies normal thresholds on day 7', () => {
    expect(changes(30_000, 20_000, earlyMonth)?.increase).toMatchObject({
      difference: 10_000,
      differenceRate: 50,
    })
    expect(changes(29_999, 20_000, earlyMonth)).toBeNull()
    expect(changes(40_000, 30_000, earlyMonth)).toBeNull()
    expect(changes(10_000, 20_000, earlyMonth)).toBeNull()
    expect(changes(18_000, 15_000, earlyMonth)).toBeNull()
    expect(changes(18_000, 15_000)?.increase).not.toBeNull()
  })

  it.each([
    [normalMonth, 3_000],
    [earlyMonth, 10_000],
  ])(
    'handles new category expenses without dividing by zero',
    (month, minimum) => {
      const previous = categories([
        transaction(90_000, { category_id: 'rent', fixed_flg: true }),
      ])
      expect(
        buildHomeChangesViewModel(
          categories([transaction(minimum)]),
          previous,
          month,
        )?.increase,
      ).toMatchObject({
        currentAmount: minimum,
        previousAmount: 0,
        differenceRate: null,
        isNewExpense: true,
      })
      expect(
        buildHomeChangesViewModel(
          categories([transaction(minimum - 1)]),
          previous,
          month,
        ),
      ).toBeNull()
    },
  )

  it('hides changes without current variable expenses or previous expense records', () => {
    expect(
      buildHomeChangesViewModel(
        categories([]),
        categories([transaction(15_000)]),
        normalMonth,
      ),
    ).toBeNull()
    expect(
      buildHomeChangesViewModel(
        categories([transaction(90_000, { fixed_flg: true })]),
        categories([transaction(15_000)]),
        normalMonth,
      ),
    ).toBeNull()
    expect(
      buildHomeChangesViewModel(
        categories([transaction(20_000)]),
        categories([]),
        normalMonth,
      ),
    ).toBeNull()
    expect(
      buildHomeChangesViewModel(
        categories([transaction(20_000)]),
        categories([transaction(20_000, { sign: 1, signed_amount: 20_000 })]),
        normalMonth,
      ),
    ).toBeNull()
  })

  it('uses flags instead of names, excludes income, and does not double-count subcategory lists', () => {
    const result = buildHomeChangesViewModel(
      categories([
        transaction(90_000, { fixed_flg: true, category_name: '家賃' }),
        transaction(50_000, {
          sign: 1,
          signed_amount: 50_000,
          category_name: '家賃',
        }),
        transaction(18_000, { category_name: '家賃' }),
      ]),
      categories([transaction(15_000)]),
      normalMonth,
    )
    expect(result?.increase).toMatchObject({
      name: '家賃',
      currentAmount: 18_000,
      previousAmount: 15_000,
      difference: 3_000,
    })
    expect(result?.decrease).toBeNull()
  })

  it('selects the largest changes and breaks ties by category ID, even with duplicate names', () => {
    const result = buildHomeChangesViewModel(
      categories([
        transaction(18_000, { category_id: 'b' }),
        transaction(18_000, { category_id: 'a' }),
        transaction(4_000, { category_id: 'c' }),
      ]),
      categories([
        transaction(15_000, { category_id: 'b' }),
        transaction(15_000, { category_id: 'a' }),
        transaction(10_000, { category_id: 'c' }),
        transaction(5_000, { category_id: 'd' }),
      ]),
      normalMonth,
    )
    expect(result?.increase?.categoryId).toBe('a')
    expect(result?.decrease).toMatchObject({
      categoryId: 'c',
      difference: -6_000,
    })
  })

  it('detects categories disappearing from current spending when other variable expenses are recorded', () => {
    const result = buildHomeChangesViewModel(
      categories([transaction(3_000, { category_id: 'a' })]),
      categories([transaction(3_000, { category_id: 'b' })]),
      normalMonth,
    )
    expect(result?.decrease).toMatchObject({
      categoryId: 'b',
      currentAmount: 0,
      differenceRate: -100,
    })
    expect(result?.currentRange.end_date).toBe('2026-10-07')
  })
})
