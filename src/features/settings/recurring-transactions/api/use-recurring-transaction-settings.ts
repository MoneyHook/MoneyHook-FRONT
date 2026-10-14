import { useQueryClient } from '@tanstack/react-query'

import {
  getGetDeletedFixedQueryKey,
  getGetDeletedFixedQueryOptions,
  getGetFixedQueryKey,
  getGetFixedQueryOptions,
  useAddFixed,
  useDeleteFixed,
  useEditFixed,
} from '@/shared/api/generated/fixed/fixed'
import type {
  DeletedFixed,
  FixedListResponse,
} from '@/shared/api/generated/model'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'
import {
  useCategoriesWithSubcategories,
  usePayments,
} from '@/shared/hooks/use-reference-queries'
import { clearPersistedQueryData } from '@/shared/lib/persisted-user-data'

function isActiveRules(value: unknown): value is FixedListResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as FixedListResponse).monthly_transaction_list)
  )
}
function isPausedRules(value: unknown): value is DeletedFixed[] {
  return Array.isArray(value)
}

export function useRecurringTransactionSettings() {
  const queryClient = useQueryClient()
  const invalidateRules = async () => {
    clearPersistedQueryData('recurring-active')
    clearPersistedQueryData('recurring-paused')
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetFixedQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDeletedFixedQueryKey() }),
    ])
  }
  const mutationOptions = { mutation: { onSuccess: invalidateRules } }

  return {
    addMutation: useAddFixed(mutationOptions),
    deleteMutation: useDeleteFixed(mutationOptions),
    editMutation: useEditFixed(mutationOptions),
    activeRulesQuery: usePersistedApiQuery({
      resource: 'recurring-active',
      parameters: {},
      isValue: isActiveRules,
      queryOptions: getGetFixedQueryOptions(),
    }),
    categoriesQuery: useCategoriesWithSubcategories(),
    pausedRulesQuery: usePersistedApiQuery({
      resource: 'recurring-paused',
      parameters: {},
      isValue: isPausedRules,
      queryOptions: getGetDeletedFixedQueryOptions(),
    }),
    paymentsQuery: usePayments(),
  }
}
