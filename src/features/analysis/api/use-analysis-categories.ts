import type { V1CategoriesResponse } from '@/shared/api/generated/model'
import { getGetV1AnalyticsCategoriesQueryOptions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import {
  buildAnalysisCategoriesViewModel,
  type CategoryGroup,
  groupDailyCategorySeries,
} from '../model/analysis-categories'
import type { AnalysisRange } from '../model/analysis-overview'

function isCategoriesResponse(value: unknown): value is V1CategoriesResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1CategoriesResponse).category_list)
  )
}

export function useAnalysisCategories(
  range: AnalysisRange,
  group: CategoryGroup,
) {
  const parameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'day' as const,
  }
  const query = usePersistedApiQuery({
    isValue: isCategoriesResponse,
    parameters,
    resource: 'analysis-categories',
    queryOptions: getGetV1AnalyticsCategoriesQueryOptions(parameters),
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response
      ? buildAnalysisCategoriesViewModel(
          {
            ...response,
            category_list: response.category_list.map((category) => ({
              ...category,
              series: groupDailyCategorySeries(category.series, group),
            })),
          },
          range,
          group,
        )
      : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
