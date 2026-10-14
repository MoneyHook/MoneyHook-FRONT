import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'

import type { V1TransactionResource } from '@/shared/api/generated/model'
import { listV1Transactions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedQueryData } from '@/shared/hooks/use-persisted-query-data'

import {
  buildTransactionsViewModel,
  buildTransactionsViewModelFromItems,
  type TransactionItem,
} from '../model/transactions'

const transactionItemsSchema = z.array(
  z.object({
    id: z.string(),
    shared: z.boolean().optional(),
    name: z.string(),
    amount: z.number(),
    sign: z.union([z.literal(-1), z.literal(1)]),
    date: z.string(),
    categoryId: z.string(),
    categoryName: z.string(),
    subcategoryName: z.string(),
    fixed: z.boolean(),
    paymentId: z.string().nullable(),
    paymentName: z.string().nullable(),
  }),
)

function isTransactionItems(value: unknown): value is TransactionItem[] {
  return transactionItemsSchema.safeParse(value).success
}

export function useTransactions(month: string) {
  const sharing = 'all'
  const cache = usePersistedQueryData({
    resource: 'transaction-list',
    parameters: { month, sharing },
    isValue: isTransactionItems,
  })
  const cachedData = useMemo(
    () =>
      cache.cachedData
        ? buildTransactionsViewModelFromItems(cache.cachedData)
        : undefined,
    [cache.cachedData],
  )
  const query = useQuery({
    queryKey: ['/api/v1/transactions', { month, sharing }],
    // Display persisted rows without marking the query as already fetched.
    placeholderData: cachedData,
    queryFn: async ({ signal }) => {
      // Complete the month before rendering calendar totals, including every page.
      const rows: V1TransactionResource[] = []
      let cursor = ''
      do {
        const r = await listV1Transactions(
          { month, sharing, cursor },
          { signal },
        )
        if (r.status !== 200)
          throw new Error('個人の取引を取得できませんでした')
        rows.push(...r.data.transactions)
        cursor = r.data.next_cursor ?? ''
      } while (cursor)
      const data = buildTransactionsViewModel(
        rows.map((t) => ({
          ...t,
          transaction_amount: t.amount,
          transaction_sign: t.sign,
        })),
      )
      if (!signal.aborted) cache.persist({ status: 200, data: data.items })
      return data
    },
  })
  return {
    // Query placeholder data is removed on error; keep persisted rows available.
    data: query.data ?? cachedData ?? null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending && !cachedData,
    refetch: query.refetch,
  }
}
