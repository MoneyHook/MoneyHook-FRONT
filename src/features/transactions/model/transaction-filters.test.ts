import { describe, expect, it } from 'vitest'

import {
  EMPTY_TRANSACTION_FILTERS,
  filterTransactions,
  getActiveFilterCount,
  parseTransactionFilters,
  summarizeFilteredTransactions,
  writeTransactionFilters,
} from './transaction-filters'
import type { TransactionItem } from './transactions'

const items: TransactionItem[] = [
  {
    id: '1',
    name: '家賃',
    amount: 50_000,
    sign: -1,
    date: '2026-09-01',
    categoryId: 'home',
    categoryName: '住宅',
    subcategoryName: '家賃',
    fixed: true,
    paymentId: 'card',
    paymentName: '楽天カード',
  },
  {
    id: '2',
    name: '昼食',
    amount: 1_200,
    sign: -1,
    date: '2026-09-02',
    categoryId: 'food',
    categoryName: '食費',
    subcategoryName: '外食',
    fixed: false,
    paymentId: 'cash',
    paymentName: '現金',
  },
  {
    id: '3',
    name: '給与',
    amount: 300_000,
    sign: 1,
    date: '2026-09-03',
    categoryId: 'income',
    categoryName: '収入',
    subcategoryName: '給与',
    fixed: true,
    paymentId: null,
    paymentName: null,
  },
]

describe('transaction filters', () => {
  it('parses only valid values and writes only active values', () => {
    expect(
      parseTransactionFilters(
        new URLSearchParams(
          'sign=expense&category=home&payment=card&fixed=fixed',
        ),
      ),
    ).toEqual({
      sign: 'expense',
      categoryId: 'home',
      paymentId: 'card',
      fixed: 'fixed',
    })
    expect(
      parseTransactionFilters(new URLSearchParams('sign=other&fixed=nope')),
    ).toEqual(EMPTY_TRANSACTION_FILTERS)
    expect(
      writeTransactionFilters(
        new URLSearchParams('month=2026-09-01&sign=income'),
        EMPTY_TRANSACTION_FILTERS,
      ).toString(),
    ).toBe('month=2026-09-01')
  })

  it('filters by combined conditions and calculates result totals', () => {
    const filtered = filterTransactions(items, {
      sign: 'expense',
      categoryId: 'home',
      paymentId: 'card',
      fixed: 'fixed',
    })
    expect(filtered.map((item) => item.id)).toEqual(['1'])
    expect(summarizeFilteredTransactions(filtered)).toEqual({
      count: 1,
      expenseAmount: 50_000,
      incomeAmount: 0,
      balanceAmount: -50_000,
    })
    expect(
      getActiveFilterCount({
        sign: 'income',
        categoryId: null,
        paymentId: null,
        fixed: 'fixed',
      }),
    ).toBe(2)
  })
})
