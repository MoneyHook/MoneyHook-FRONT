import { useEffect } from 'react'

import type { V1CategoriesResponse } from '@/shared/api/generated/model'
import { useGetV1AnalyticsCategories } from '@/shared/api/generated/transaction/transaction'
import {
  usePersistedQueryData,
  usePersistedQueryRefresh,
} from '@/shared/hooks/use-persisted-query-data'

import {
  buildAnalysisCategoriesViewModel,
  type CategoryGroup,
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
    group_by: group,
  }
  const cache = usePersistedQueryData({
    isValue: isCategoriesResponse,
    parameters,
    resource: 'analysis-categories',
  })
  const query = useGetV1AnalyticsCategories(parameters, {
    query: cache.queryOptions,
  })
  usePersistedQueryRefresh(query.refetch)
  useEffect(() => {
    cache.persist(query.data)
  }, [cache, query.data])
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response
      ? buildAnalysisCategoriesViewModel(response, range, group)
      : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
