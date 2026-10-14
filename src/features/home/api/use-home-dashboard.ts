import type {
  HomeResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'
import {
  getGetHomeQueryOptions,
  getGetV1AnalyticsFixedQueryOptions,
  getGetV1AnalyticsOverviewQueryOptions,
} from '@/shared/api/generated/transaction/transaction'
import { useBudget } from '@/shared/hooks/use-budget'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import {
  buildHomeDashboardViewModel,
  type MonthContext,
} from '../model/home-dashboard'

function isOverviewResponse(value: unknown): value is V1OverviewResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1OverviewResponse).series)
  )
}

function isHomeResponse(value: unknown): value is HomeResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as HomeResponse).category_list)
  )
}

function isFixedResponse(value: unknown): value is V1FixedResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1FixedResponse).category_list)
  )
}

export function useHomeDashboard(month: MonthContext) {
  const currentOverviewParameters = {
    start_date: month.startDate,
    end_date: month.endDate,
    group_by: 'day' as const,
    compare: 'none' as const,
  }
  const previousOverviewParameters = {
    start_date: month.previousStartDate,
    end_date: month.previousEndDate,
    group_by: 'day' as const,
    compare: 'none' as const,
  }
  const currentHomeParameters = { month: month.month }
  const previousHomeParameters = { month: month.previousMonth }
  const fixedParameters = {
    start_date: month.startDate,
    end_date: month.endDate,
    group_by: 'month' as const,
  }
  const currentOverview = usePersistedApiQuery({
    isValue: isOverviewResponse,
    parameters: currentOverviewParameters,
    resource: 'home-overview',
    queryOptions: getGetV1AnalyticsOverviewQueryOptions(
      currentOverviewParameters,
    ),
  })
  const previousOverview = usePersistedApiQuery({
    isValue: isOverviewResponse,
    parameters: previousOverviewParameters,
    resource: 'home-overview',
    queryOptions: getGetV1AnalyticsOverviewQueryOptions(
      previousOverviewParameters,
    ),
  })
  const currentHome = usePersistedApiQuery({
    isValue: isHomeResponse,
    parameters: currentHomeParameters,
    resource: 'home-summary',
    queryOptions: getGetHomeQueryOptions(currentHomeParameters),
  })
  const previousHome = usePersistedApiQuery({
    isValue: isHomeResponse,
    parameters: previousHomeParameters,
    resource: 'home-summary',
    queryOptions: getGetHomeQueryOptions(previousHomeParameters),
  })
  const fixed = usePersistedApiQuery({
    isValue: isFixedResponse,
    parameters: fixedParameters,
    resource: 'home-fixed',
    queryOptions: getGetV1AnalyticsFixedQueryOptions(fixedParameters),
  })
  const budget = useBudget(month.month)

  const queries = [
    currentOverview,
    previousOverview,
    currentHome,
    previousHome,
    fixed,
    budget,
  ]
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.error)?.error ?? null

  const currentOverviewData =
    currentOverview.data?.status === 200 ? currentOverview.data.data : null
  const previousOverviewData =
    previousOverview.data?.status === 200 ? previousOverview.data.data : null
  const currentHomeData =
    currentHome.data?.status === 200 ? currentHome.data.data : null
  const previousHomeData =
    previousHome.data?.status === 200 ? previousHome.data.data : null
  const fixedData = fixed.data?.status === 200 ? fixed.data.data : null
  const budgetData = budget.data?.status === 200 ? budget.data.data : null

  const data =
    currentOverviewData &&
    previousOverviewData &&
    currentHomeData &&
    previousHomeData &&
    fixedData
      ? buildHomeDashboardViewModel({
          currentOverview: currentOverviewData,
          previousOverview: previousOverviewData,
          currentHome: currentHomeData,
          previousHome: previousHomeData,
          fixed: fixedData,
          budget: budgetData,
          month,
        })
      : null

  return {
    data,
    isBudgetPending: budget.isPending,
    error,
    isError: isError && !data,
    isPending: isPending && !data,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}
