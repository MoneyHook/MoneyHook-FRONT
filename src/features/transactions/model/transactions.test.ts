import { describe, expect, it } from 'vitest'

import type { TimelineTransaction } from '@/shared/api/generated/model'

import {
  buildCalendarDays,
  buildTransactionsViewModel,
  createTransactionMonth,
  getDefaultSelectedDate,
  normalizeMonthParam,
  normalizeSelectedDate,
} from './transactions'

function transaction(
  overrides: Partial<TimelineTransaction> = {},
): TimelineTransaction {
  return {
    transaction_id: '1',
    transaction_name: 'ランチ',
    transaction_amount: 1_200,
    transaction_sign: -1,
    transaction_date: '2024-08-28',
    category_id: '10',
    category_name: '食費',
    sub_category_id: '11',
    sub_category_name: '外食',
    fixed_flg: false,
    payment_id: '20',
    payment_name: '楽天カード',
    ...overrides,
  }
}

describe('transaction view model', () => {
  it('normalizes invalid and future months to the current month', () => {
    const now = new Date(2026, 7, 30, 12)

    expect(normalizeMonthParam(null, now)).toBe('2026-08-01')
    expect(normalizeMonthParam('invalid', now)).toBe('2026-08-01')
    expect(normalizeMonthParam('2026-09-01', now)).toBe('2026-08-01')
    expect(normalizeMonthParam('2024-08-01', now)).toBe('2024-08-01')
  })

  it('sorts and groups transactions while calculating monthly totals', () => {
    const result = buildTransactionsViewModel([
      transaction({ transaction_id: '2', transaction_amount: 3_480 }),
      transaction({
        transaction_id: '3',
        transaction_name: '給与',
        transaction_amount: 25_000,
        transaction_sign: 1,
        transaction_date: '2024-08-26',
        category_name: '収入',
        sub_category_name: '給与',
      }),
      transaction({
        transaction_id: '1',
        transaction_amount: 500,
        transaction_date: '2024-08-27',
      }),
    ])

    expect(result.groups.map((group) => group.date)).toEqual([
      '2024-08-28',
      '2024-08-27',
      '2024-08-26',
    ])
    expect(result.expenseAmount).toBe(3_980)
    expect(result.incomeAmount).toBe(25_000)
    expect(result.balanceAmount).toBe(21_020)
    expect(result.groups[2]).toMatchObject({ expenseAmount: 0, incomeAmount: 25_000 })
  })

  it('builds complete Sunday-first calendar weeks', () => {
    const month = createTransactionMonth('2024-08-01', new Date(2026, 7, 30))
    const days = buildCalendarDays(month)

    expect(days).toHaveLength(35)
    expect(days[0]).toEqual({ date: '2024-07-28', day: 28, isCurrentMonth: false })
    expect(days.at(-1)).toEqual({ date: '2024-08-31', day: 31, isCurrentMonth: true })
  })

  it('selects today for the current month and the latest transaction for a past month', () => {
    const now = new Date(2026, 7, 30, 12)
    const currentMonth = createTransactionMonth('2026-08-01', now)
    const pastMonth = createTransactionMonth('2024-08-01', now)
    const data = buildTransactionsViewModel([
      transaction({ transaction_date: '2024-08-26' }),
      transaction({ transaction_id: '2', transaction_date: '2024-08-28' }),
    ])

    expect(getDefaultSelectedDate(currentMonth, [], now)).toBe('2026-08-30')
    expect(getDefaultSelectedDate(pastMonth, data.items, now)).toBe('2024-08-28')
    expect(normalizeSelectedDate('2024-09-01', pastMonth, data.items, now)).toBe(
      '2024-08-28',
    )
  })
})
