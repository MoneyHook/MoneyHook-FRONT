import type { QueryClient } from '@tanstack/react-query'

import { getGetFrequentTransactionNamesQueryKey } from '@/shared/api/generated/transaction/transaction'
import {
  clearPersistedQueryData,
  removePersistedUserData,
} from '@/shared/lib/persisted-user-data'
import { TRANSACTION_FORM_REFERENCE_CACHE_KEYS } from '@/shared/lib/transaction-reference-cache'

// Aggregates can span multiple months. Invalidate every cached range, including
// both the previous and new month when an edited transaction changes its date.
const transactionReadQueryKeys = [
  ['/api/v1/transactions'],
  ['/api/v1/analytics/overview'],
  ['/api/v1/analytics/categories'],
  ['/api/v1/analytics/fixed'],
  ['/api/v1/analytics/payments'],
  ['/api/transaction/getHome'],
  ['/api/transaction/getTimelineData'],
] as const

export async function invalidateTransactionQueries(
  queryClient: QueryClient,
  { householdReferences = true }: { householdReferences?: boolean } = {},
) {
  clearPersistedQueryData()
  removePersistedUserData(
    TRANSACTION_FORM_REFERENCE_CACHE_KEYS.frequentTransactions,
  )
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['households'],
      predicate: ({ queryKey }) =>
        queryKey[1] === 'entries' ||
        (householdReferences && queryKey[2] === 'settings'),
    }),
    // Suggestions are used on the next recording screen, after navigation.
    queryClient.invalidateQueries({
      queryKey: getGetFrequentTransactionNamesQueryKey(),
      refetchType: 'none',
    }),
    ...transactionReadQueryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  ])
}
