import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'
import {
  addTransactionList,
  useGetFrequentTransactionNames,
} from '@/shared/api/generated/transaction/transaction'

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
  const categoriesQuery = useGetCategoryWithSubCategoryList()
  const paymentsQuery = useGetPaymentResources()
  const frequentTransactionsQuery = useGetFrequentTransactionNames()
  const categories = useMemo<Categories>(
    () =>
      categoriesQuery.data?.status === 200 ? (categoriesQuery.data.data.category_list ?? []) : [],
    [categoriesQuery.data],
  )
  const payments =
    paymentsQuery.data?.status === 200 ? (paymentsQuery.data.data.payment_list ?? []) : []
  const frequentTransactions = useMemo(
    () =>
      frequentTransactionsQuery.data?.status === 200
        ? frequentTransactionsQuery.data.data.transaction_list
        : [],
    [frequentTransactionsQuery.data],
  )
  const mutation = useMutation({
    mutationFn: (request: ReturnType<typeof toTransactionList>) => addTransactionList(request),
    onSuccess: async () => {
      await onImported()
      onSuccess()
    },
    onError: onError,
  })
  return { categories, payments, frequentTransactions, mutation }
}
