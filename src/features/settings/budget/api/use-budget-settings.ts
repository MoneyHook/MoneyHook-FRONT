import { useQueryClient } from '@tanstack/react-query'

import {
  getGetV1BudgetQueryKey,
  usePutV1Budget,
} from '@/shared/api/generated/budget/budget'
import { useBudget } from '@/shared/hooks/use-budget'
import { clearPersistedQueryData } from '@/shared/lib/persisted-user-data'

import { getCurrentMonthStart } from '../model/budget-settings'

export function useBudgetSettings() {
  const currentMonth = getCurrentMonthStart()
  const queryClient = useQueryClient()
  const budgetQuery = useBudget(currentMonth)
  const saveMutation = usePutV1Budget({
    mutation: {
      onSuccess: async () => {
        clearPersistedQueryData('budget')
        await queryClient.invalidateQueries({
          queryKey: getGetV1BudgetQueryKey(),
        })
      },
    },
  })

  return {
    budgetQuery,
    currentMonth,
    saveMutation,
  }
}
