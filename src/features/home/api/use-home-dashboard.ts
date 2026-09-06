import { useEffect } from 'react'

import type { HomeResponse, V1FixedResponse, V1OverviewResponse } from '@/shared/api/generated/model'
import {
  useGetHome,
  useGetV1AnalyticsFixed,
  useGetV1AnalyticsOverview,
} from '@/shared/api/generated/transaction/transaction'
import { useGetV1Budget } from '@/shared/api/generated/budget/budget'
import { usePersistedQueryData, usePersistedQueryRefresh } from '@/shared/hooks/use-persisted-query-data'

import {
  buildHomeDashboardViewModel,
  type MonthContext,
} from '../model/home-dashboard'

function isOverviewResponse(value: unknown): value is V1OverviewResponse {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as V1OverviewResponse).series)
}

function isHomeResponse(value: unknown): value is HomeResponse {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as HomeResponse).category_list)
}

function isFixedResponse(value: unknown): value is V1FixedResponse {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as V1FixedResponse).category_list)
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
  const currentOverviewCache = usePersistedQueryData({ isValue: isOverviewResponse, parameters: currentOverviewParameters, resource: 'home-overview' })
  const previousOverviewCache = usePersistedQueryData({ isValue: isOverviewResponse, parameters: previousOverviewParameters, resource: 'home-overview' })
  const currentHomeCache = usePersistedQueryData({ isValue: isHomeResponse, parameters: currentHomeParameters, resource: 'home-summary' })
  const previousHomeCache = usePersistedQueryData({ isValue: isHomeResponse, parameters: previousHomeParameters, resource: 'home-summary' })
  const fixedCache = usePersistedQueryData({ isValue: isFixedResponse, parameters: fixedParameters, resource: 'home-fixed' })
  const currentOverview = useGetV1AnalyticsOverview(currentOverviewParameters, { query: currentOverviewCache.queryOptions })
  const previousOverview = useGetV1AnalyticsOverview(previousOverviewParameters, { query: previousOverviewCache.queryOptions })
  const currentHome = useGetHome(currentHomeParameters, { query: currentHomeCache.queryOptions })
  const previousHome = useGetHome(previousHomeParameters, { query: previousHomeCache.queryOptions })
  const fixed = useGetV1AnalyticsFixed(fixedParameters, { query: fixedCache.queryOptions })
  const budget = useGetV1Budget({ month: month.month })

  usePersistedQueryRefresh(currentOverview.refetch)
  usePersistedQueryRefresh(previousOverview.refetch)
  usePersistedQueryRefresh(currentHome.refetch)
  usePersistedQueryRefresh(previousHome.refetch)
  usePersistedQueryRefresh(fixed.refetch)
  useEffect(() => { currentOverviewCache.persist(currentOverview.data) }, [currentOverviewCache, currentOverview.data])
  useEffect(() => { previousOverviewCache.persist(previousOverview.data) }, [previousOverviewCache, previousOverview.data])
  useEffect(() => { currentHomeCache.persist(currentHome.data) }, [currentHomeCache, currentHome.data])
  useEffect(() => { previousHomeCache.persist(previousHome.data) }, [previousHomeCache, previousHome.data])
  useEffect(() => { fixedCache.persist(fixed.data) }, [fixedCache, fixed.data])

  const queries = [currentOverview, previousOverview, currentHome, previousHome, fixed, budget]
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.error)?.error ?? null

  const currentOverviewData =
    currentOverview.data?.status === 200 ? currentOverview.data.data : null
  const previousOverviewData =
    previousOverview.data?.status === 200 ? previousOverview.data.data : null
  const currentHomeData = currentHome.data?.status === 200 ? currentHome.data.data : null
  const previousHomeData = previousHome.data?.status === 200 ? previousHome.data.data : null
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
    error,
    isError: isError && !data,
    isPending: isPending && !data,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}
