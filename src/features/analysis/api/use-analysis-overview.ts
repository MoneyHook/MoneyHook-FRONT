import {
  getGetV1AnalyticsCategoriesQueryOptions,
  getGetV1AnalyticsFixedQueryOptions,
  getGetV1AnalyticsOverviewQueryOptions,
} from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import {
  type AnalysisRange,
  buildAnalysisOverviewViewModel,
} from '../model/analysis-overview'

function isOverviewResponse(value: unknown): value is V1OverviewResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1OverviewResponse).series)
  )
}

function isCategoriesResponse(value: unknown): value is V1CategoriesResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1CategoriesResponse).category_list)
  )
}

function isFixedResponse(value: unknown): value is V1FixedResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1FixedResponse).category_list)
  )
}

export function useAnalysisOverview(range: AnalysisRange) {
  const overviewParameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
    compare: 'previous_period' as const,
  }
  const categoriesParameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
  }
  const fixedParameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
  }
  const overview = usePersistedApiQuery({
    isValue: isOverviewResponse,
    parameters: overviewParameters,
    resource: 'analysis-overview',
    queryOptions: getGetV1AnalyticsOverviewQueryOptions(overviewParameters),
  })
  const categories = usePersistedApiQuery({
    isValue: isCategoriesResponse,
    parameters: categoriesParameters,
    resource: 'analysis-categories',
    queryOptions: getGetV1AnalyticsCategoriesQueryOptions(categoriesParameters),
  })
  const fixed = usePersistedApiQuery({
    isValue: isFixedResponse,
    parameters: fixedParameters,
    resource: 'analysis-fixed',
    queryOptions: getGetV1AnalyticsFixedQueryOptions(fixedParameters),
  })

  const queries = [overview, categories, fixed]
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.error)?.error ?? null
  const overviewData = overview.data?.status === 200 ? overview.data.data : null
  const categoriesData =
    categories.data?.status === 200 ? categories.data.data : null
  const fixedData = fixed.data?.status === 200 ? fixed.data.data : null
  const data =
    overviewData && categoriesData && fixedData
      ? buildAnalysisOverviewViewModel({
          overview: overviewData,
          categories: categoriesData,
          fixed: fixedData,
          range,
        })
      : null

  return {
    data,
    error,
    isError: isError && !data,
    isPending: isPending && !data,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}
import type {
  V1CategoriesResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'
