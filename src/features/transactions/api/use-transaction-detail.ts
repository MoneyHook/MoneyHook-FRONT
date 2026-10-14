import type { V1TransactionResponse } from '@/shared/api/generated/model'
import { getGetV1TransactionQueryOptions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

function isTransactionDetail(value: unknown): value is V1TransactionResponse {
  return value !== null && typeof value === 'object' && 'transaction' in value
}

export function useTransactionDetail(transactionId: string | undefined) {
  const id = transactionId ?? ''
  const query = usePersistedApiQuery({
    isValue: isTransactionDetail,
    parameters: { transactionId: id },
    resource: 'transaction-detail',
    queryOptions: getGetV1TransactionQueryOptions(id, {
      query: { enabled: Boolean(transactionId) },
    }),
  })

  return query
}
