import {
  useGetHome,
  useGetV1AnalyticsFixed,
  useGetV1AnalyticsOverview,
} from '@/shared/api/generated/transaction/transaction'

import {
  buildHomeDashboardViewModel,
  type MonthContext,
} from '../model/home-dashboard'

export function useHomeDashboard(month: MonthContext) {
  const currentOverview = useGetV1AnalyticsOverview({
    start_date: month.startDate,
    end_date: month.endDate,
    group_by: 'day',
    compare: 'none',
  })
  const previousOverview = useGetV1AnalyticsOverview({
    start_date: month.previousStartDate,
    end_date: month.previousEndDate,
    group_by: 'day',
    compare: 'none',
  })
  const currentHome = useGetHome({ month: month.month })
  const previousHome = useGetHome({ month: month.previousMonth })
  const fixed = useGetV1AnalyticsFixed({
    start_date: month.startDate,
    end_date: month.endDate,
    group_by: 'month',
  })

  const queries = [currentOverview, previousOverview, currentHome, previousHome, fixed]
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

  const data =
    !isPending &&
    !isError &&
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
          month,
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
