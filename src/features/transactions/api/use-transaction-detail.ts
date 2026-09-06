import { useEffect } from 'react'

import type { V1TransactionResponse } from '@/shared/api/generated/model'
import { useGetV1Transaction } from '@/shared/api/generated/transaction/transaction'
import { usePersistedQueryData, usePersistedQueryRefresh } from '@/shared/hooks/use-persisted-query-data'

function isTransactionDetail(value: unknown): value is V1TransactionResponse {
  return value !== null && typeof value === 'object' && 'transaction' in value
}

export function useTransactionDetail(transactionId: string | undefined) {
  const id = transactionId ?? ''
  const cache = usePersistedQueryData({
    isValue: isTransactionDetail,
    parameters: { transactionId: id },
    resource: 'transaction-detail',
  })
  const query = useGetV1Transaction(id, {
    query: { enabled: Boolean(transactionId), ...cache.queryOptions },
  })
  usePersistedQueryRefresh(query.refetch, Boolean(transactionId))
  useEffect(() => {
    cache.persist(query.data)
  }, [cache, query.data])

  return query
}
