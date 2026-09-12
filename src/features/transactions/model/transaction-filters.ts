import type { TransactionItem } from './transactions'

export type TransactionSignFilter = 'expense' | 'income' | null
export type TransactionFixedFilter = 'fixed' | 'variable' | null

export type TransactionFilters = {
  sign: TransactionSignFilter
  categoryId: string | null
  paymentId: string | null
  fixed: TransactionFixedFilter
}

export const EMPTY_TRANSACTION_FILTERS: TransactionFilters = {
  sign: null,
  categoryId: null,
  paymentId: null,
  fixed: null,
}

export type TransactionFilterSummary = {
  count: number
  expenseAmount: number
  incomeAmount: number
  balanceAmount: number
}

export function parseTransactionFilters(
  params: URLSearchParams,
): TransactionFilters {
  const sign = params.get('sign')
  const fixed = params.get('fixed')

  return {
    sign: sign === 'expense' || sign === 'income' ? sign : null,
    categoryId: params.get('category') || null,
    paymentId: params.get('payment') || null,
    fixed: fixed === 'fixed' || fixed === 'variable' ? fixed : null,
  }
}

export function writeTransactionFilters(
  params: URLSearchParams,
  filters: TransactionFilters,
) {
  const values = {
    sign: filters.sign,
    category: filters.categoryId,
    payment: filters.paymentId,
    fixed: filters.fixed,
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
  })

  return params
}

export function filterTransactions(
  items: TransactionItem[],
  filters: TransactionFilters,
) {
  return items.filter((item) => {
    if (filters.sign === 'expense' && item.sign !== -1) return false
    if (filters.sign === 'income' && item.sign !== 1) return false
    if (filters.categoryId && item.categoryId !== filters.categoryId)
      return false
    if (filters.paymentId && item.paymentId !== filters.paymentId) return false
    if (filters.fixed === 'fixed' && !item.fixed) return false
    if (filters.fixed === 'variable' && item.fixed) return false
    return true
  })
}

export function summarizeFilteredTransactions(
  items: TransactionItem[],
): TransactionFilterSummary {
  const expenseAmount = items.reduce(
    (total, item) => total + (item.sign === -1 ? item.amount : 0),
    0,
  )
  const incomeAmount = items.reduce(
    (total, item) => total + (item.sign === 1 ? item.amount : 0),
    0,
  )

  return {
    count: items.length,
    expenseAmount,
    incomeAmount,
    balanceAmount: incomeAmount - expenseAmount,
  }
}

export function getActiveFilterCount(filters: TransactionFilters) {
  return Object.values(filters).filter(Boolean).length
}
