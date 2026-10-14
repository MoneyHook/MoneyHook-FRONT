import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'

import { addTransactionList } from '@/shared/api/generated/transaction/transaction'
import {
  useCategoriesWithSubcategories,
  useFrequentTransactions,
  usePayments,
} from '@/shared/hooks/use-reference-queries'

import { toTransactionList } from '../model/csv-import'
import type { Categories } from '../types'

export function useCsvImportApi({
  onSuccess,
  onImported,
  onError,
}: {
  onImported: () => Promise<void>
  onSuccess: () => void
  onError: () => void
}) {
  const categoriesQuery = useCategoriesWithSubcategories()
  const paymentsQuery = usePayments()
  const frequentTransactionsQuery = useFrequentTransactions()
  const categories = useMemo<Categories>(
    () =>
      categoriesQuery.data?.status === 200
        ? (categoriesQuery.data.data.category_list ?? [])
        : [],
    [categoriesQuery.data],
  )
  const payments =
    paymentsQuery.data?.status === 200
      ? (paymentsQuery.data.data.payment_list ?? [])
      : []
  const frequentTransactions = useMemo(
    () =>
      frequentTransactionsQuery.data?.status === 200
        ? frequentTransactionsQuery.data.data.transaction_list
        : [],
    [frequentTransactionsQuery.data],
  )
  const mutation = useMutation({
    mutationFn: (request: ReturnType<typeof toTransactionList>) =>
      addTransactionList(request),
    onSuccess: async () => {
      await onImported()
      onSuccess()
    },
    onError: onError,
  })
  return { categories, payments, frequentTransactions, mutation }
}
