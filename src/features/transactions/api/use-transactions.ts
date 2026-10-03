import { useQuery } from '@tanstack/react-query'

import type { V1TransactionResource } from '@/shared/api/generated/model'
import { listV1Transactions } from '@/shared/api/generated/transaction/transaction'

import { buildTransactionsViewModel } from '../model/transactions'

export function useTransactions(month: string) {
  const sharing = 'all'
  const query = useQuery({
    queryKey: ['/api/v1/transactions', { month, sharing }],
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
      return buildTransactionsViewModel(
        rows.map((t) => ({
          ...t,
          transaction_amount: t.amount,
          transaction_sign: t.sign,
        })),
      )
    },
  })
  return {
    data: query.data ?? null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    refetch: query.refetch,
  }
}
