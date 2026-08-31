import {
  useGetV1AnalyticsCategories,
  useGetV1AnalyticsFixed,
  useGetV1AnalyticsOverview,
} from '@/shared/api/generated/transaction/transaction'

import {
  buildAnalysisOverviewViewModel,
  type AnalysisRange,
} from '../model/analysis-overview'

export function useAnalysisOverview(range: AnalysisRange) {
  const overview = useGetV1AnalyticsOverview({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month',
    compare: 'previous_period',
  })
  const categories = useGetV1AnalyticsCategories({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month',
  })
  const fixed = useGetV1AnalyticsFixed({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month',
  })

  const queries = [overview, categories, fixed]
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.error)?.error ?? null
  const overviewData = overview.data?.status === 200 ? overview.data.data : null
  const categoriesData = categories.data?.status === 200 ? categories.data.data : null
  const fixedData = fixed.data?.status === 200 ? fixed.data.data : null
  const data =
    !isPending && !isError && overviewData && categoriesData && fixedData
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
    isError,
    isPending,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}
