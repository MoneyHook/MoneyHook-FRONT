import type { QueryClient } from '@tanstack/react-query'

import { getGetFrequentTransactionNamesQueryKey } from '@/shared/api/generated/transaction/transaction'
import { clearPersistedQueryData } from '@/shared/lib/persisted-user-data'

// Aggregates can span multiple months. Invalidate every cached range, including
// both the previous and new month when an edited transaction changes its date.
const transactionReadQueryKeys = [
  ['/api/v1/analytics/overview'],
  ['/api/v1/analytics/categories'],
  ['/api/v1/analytics/fixed'],
  ['/api/v1/analytics/payments'],
  ['/api/transaction/getHome'],
  ['/api/transaction/getTimelineData'],
  getGetFrequentTransactionNamesQueryKey(),
] as const

export async function invalidateTransactionQueries(queryClient: QueryClient) {
  clearPersistedQueryData()
  await Promise.all(
    transactionReadQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  )
}
