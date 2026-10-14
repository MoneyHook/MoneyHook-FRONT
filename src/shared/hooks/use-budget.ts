import { getGetV1BudgetQueryOptions } from '@/shared/api/generated/budget/budget'
import type { V1BudgetResponse } from '@/shared/api/generated/model'

import { usePersistedApiQuery } from './use-persisted-api-query'

function isBudget(value: unknown): value is V1BudgetResponse {
  if (!value || typeof value !== 'object') return false
  const budget = value as V1BudgetResponse
  return (
    (budget.monthly_budget_amount === null ||
      typeof budget.monthly_budget_amount === 'number') &&
    (budget.effective_from === null ||
      typeof budget.effective_from === 'string')
  )
}
export function useBudget(month: string) {
  return usePersistedApiQuery({
    resource: 'budget',
    parameters: { month },
    isValue: isBudget,
    queryOptions: getGetV1BudgetQueryOptions({ month }),
  })
}
