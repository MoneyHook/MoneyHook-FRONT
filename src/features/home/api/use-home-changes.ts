import type { V1CategoriesResponse } from '@/shared/api/generated/model'
import { getGetV1AnalyticsCategoriesQueryOptions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import {
  buildHomeChangesViewModel,
  createHomeChangeParameters,
} from '../model/home-changes'
import type { MonthContext } from '../model/home-dashboard'

function isCategoriesResponse(value: unknown): value is V1CategoriesResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1CategoriesResponse).category_list)
  )
}

export function useHomeChanges(month: MonthContext) {
  const parameters = createHomeChangeParameters(month)
  const current = usePersistedApiQuery({
    isValue: isCategoriesResponse,
    parameters: parameters.current,
    resource: 'analysis-categories',
    queryOptions: getGetV1AnalyticsCategoriesQueryOptions(parameters.current),
  })
  const previous = usePersistedApiQuery({
    isValue: isCategoriesResponse,
    parameters: parameters.previous,
    resource: 'analysis-categories',
    queryOptions: getGetV1AnalyticsCategoriesQueryOptions(parameters.previous),
  })

  const currentData = current.data?.status === 200 ? current.data.data : null
  const previousData = previous.data?.status === 200 ? previous.data.data : null
  const isPending = current.isPending || previous.isPending
  const isError = current.isError || previous.isError
  return {
    data:
      !isPending && !isError && currentData && previousData
        ? buildHomeChangesViewModel(currentData, previousData, month)
        : null,
    isPending,
    isError,
  }
}
