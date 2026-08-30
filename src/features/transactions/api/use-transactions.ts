import { useGetTimelineData } from '@/shared/api/generated/transaction/transaction'

import { buildTransactionsViewModel } from '../model/transactions'

export function useTransactions(month: string) {
  const query = useGetTimelineData({ month })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildTransactionsViewModel(response.transaction_list) : null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    refetch: query.refetch,
  }
}
