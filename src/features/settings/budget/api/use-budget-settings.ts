import { useQueryClient } from '@tanstack/react-query'

import {
  getGetV1BudgetQueryKey,
  useGetV1Budget,
  usePutV1Budget,
} from '@/shared/api/generated/budget/budget'

import { getCurrentMonthStart } from '../model/budget-settings'

export function useBudgetSettings() {
  const currentMonth = getCurrentMonthStart()
  const queryClient = useQueryClient()
  const budgetQuery = useGetV1Budget({ month: currentMonth })
  const saveMutation = usePutV1Budget({
    mutation: {
      onSuccess: async () => {
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
