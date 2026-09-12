import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useTransactionFilterReferences } from '../api/use-transaction-filter-references'
import { useTransactions } from '../api/use-transactions'
import {
  buildTransactionsViewModelFromItems,
  createTransactionMonth,
  normalizeMonthParam,
  normalizeSelectedDate,
  normalizeTransactionView,
  type TransactionView,
} from '../model/transactions'
import {
  EMPTY_TRANSACTION_FILTERS,
  filterTransactions,
  getActiveFilterCount,
  parseTransactionFilters,
  summarizeFilteredTransactions,
  writeTransactionFilters,
  type TransactionFilters,
} from '../model/transaction-filters'

export function useTransactionsController() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false)
  const rawMonth = searchParams.get('month')
  const rawView = searchParams.get('view')
  const rawDate = searchParams.get('date')
  const normalizedMonth = useMemo(
    () => normalizeMonthParam(rawMonth),
    [rawMonth],
  )
  const month = useMemo(
    () => createTransactionMonth(normalizedMonth),
    [normalizedMonth],
  )
  const view = normalizeTransactionView(rawView)
  const transactions = useTransactions(month.month)
  const filters = useMemo(
    () => parseTransactionFilters(searchParams),
    [searchParams],
  )
  const activeFilterCount = getActiveFilterCount(filters)
  const references = useTransactionFilterReferences(
    mobileFilterOpen || desktopFilterOpen || activeFilterCount > 0,
  )
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(filters)
  const filteredData = useMemo(
    () =>
      transactions.data
        ? buildTransactionsViewModelFromItems(
            filterTransactions(transactions.data.items, filters),
          )
        : null,
    [filters, transactions.data],
  )
  const filterSummary = useMemo(
    () => summarizeFilteredTransactions(filteredData?.items ?? []),
    [filteredData],
  )
  const selectedDate = transactions.data
    ? normalizeSelectedDate(rawDate, month, filteredData?.items ?? [])
    : `${month.monthInput}-01`

  const updateFilters = useCallback(
    (nextFilters: TransactionFilters) => {
      const next = writeTransactionFilters(
        new URLSearchParams(searchParams),
        nextFilters,
      )
      next.delete('date')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const categoryIsInvalid =
      filters.categoryId &&
      references.categoriesReady &&
      !references.categories.some(
        (category) => category.category_id === filters.categoryId,
      )
    const paymentIsInvalid =
      filters.paymentId &&
      references.paymentsReady &&
      !references.payments.some(
        (payment) => payment.payment_id === filters.paymentId,
      )
    if (categoryIsInvalid || paymentIsInvalid) {
      updateFilters({
        ...filters,
        categoryId: categoryIsInvalid ? null : filters.categoryId,
        paymentId: paymentIsInvalid ? null : filters.paymentId,
      })
    }
  }, [
    filters,
    references.categories,
    references.categoriesReady,
    references.payments,
    references.paymentsReady,
    updateFilters,
  ])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    if (rawMonth !== normalizedMonth) {
      next.set('month', normalizedMonth)
      changed = true
    }
    if (rawView !== view) {
      next.set('view', view)
      changed = true
    }
    if (view === 'calendar' && transactions.data && rawDate !== selectedDate) {
      next.set('date', selectedDate)
      changed = true
    }
    if (view === 'list' && rawDate) {
      next.delete('date')
      changed = true
    }
    if (changed) setSearchParams(next, { replace: true })
  }, [
    normalizedMonth,
    rawDate,
    rawMonth,
    rawView,
    searchParams,
    selectedDate,
    setSearchParams,
    transactions.data,
    view,
  ])

  const changeView = (nextView: TransactionView) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', nextView)
    if (nextView === 'list') next.delete('date')
    setSearchParams(next)
  }
  const changeMonth = (nextMonth: string) => {
    if (!nextMonth) return
    const next = new URLSearchParams(searchParams)
    next.set('month', nextMonth)
    next.delete('date')
    setSearchParams(next)
  }
  const changeDate = (date: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('date', date)
    setSearchParams(next)
  }
  const openTransaction = (transactionId: string) => {
    navigate(`/app/transactions/${encodeURIComponent(transactionId)}/edit`, {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    })
  }
  const applyFilters = () => {
    updateFilters(draftFilters)
    setMobileFilterOpen(false)
    setDesktopFilterOpen(false)
  }

  return {
    activeFilterCount,
    applyFilters,
    changeDate,
    changeMonth,
    changeView,
    clearAppliedFilters: () => updateFilters(EMPTY_TRANSACTION_FILTERS),
    data: transactions.data,
    desktopFilterOpen,
    draftFilters,
    error: transactions.error,
    filterSummary,
    filteredData,
    filters,
    isError: transactions.isError,
    isPending: transactions.isPending,
    mobileFilterOpen,
    month,
    openDesktopFilters: () => {
      setDraftFilters(filters)
      setDesktopFilterOpen(true)
    },
    openMobileFilters: () => {
      setDraftFilters(filters)
      setMobileFilterOpen(true)
    },
    openNewTransaction: () => navigate('/app/transactions/new'),
    openTransaction,
    references,
    refetch: transactions.refetch,
    removeFilter: (key: keyof TransactionFilters) =>
      updateFilters({ ...filters, [key]: null }),
    selectedDate,
    setDesktopFilterOpen,
    setDraftFilters,
    setMobileFilterOpen,
    view,
  }
}
