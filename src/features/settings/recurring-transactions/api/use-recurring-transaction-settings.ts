import { useQueryClient } from '@tanstack/react-query'

import {
  getGetDeletedFixedQueryKey,
  getGetFixedQueryKey,
  useAddFixed,
  useDeleteFixed,
  useEditFixed,
  useGetDeletedFixed,
  useGetFixed,
} from '@/shared/api/generated/fixed/fixed'
import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'

export function useRecurringTransactionSettings() {
  const queryClient = useQueryClient()
  const invalidateRules = async () => {
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
    activeRulesQuery: useGetFixed(),
    categoriesQuery: useGetCategoryWithSubCategoryList(),
    pausedRulesQuery: useGetDeletedFixed(),
    paymentsQuery: useGetPaymentResources(),
  }
}
