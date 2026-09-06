import { useEffect } from 'react'

import type { TimelineResponse } from '@/shared/api/generated/model'
import { useGetTimelineData } from '@/shared/api/generated/transaction/transaction'
import { usePersistedQueryData, usePersistedQueryRefresh } from '@/shared/hooks/use-persisted-query-data'

import { buildTransactionsViewModel } from '../model/transactions'

export function useTransactions(month: string) {
  const cache = usePersistedQueryData({
    isValue: (value): value is TimelineResponse => Boolean(value) && typeof value === 'object' && Array.isArray((value as TimelineResponse).transaction_list),
    parameters: { month },
    resource: 'transaction-timeline',
  })
  const query = useGetTimelineData({ month }, { query: cache.queryOptions })
  usePersistedQueryRefresh(query.refetch)
  useEffect(() => {
    cache.persist(query.data)
  }, [cache, query.data])
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildTransactionsViewModel(response.transaction_list) : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
