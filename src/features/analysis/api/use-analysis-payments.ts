import { useGetV1AnalyticsPayments } from '@/shared/api/generated/transaction/transaction'

import { buildAnalysisPaymentsViewModel } from '../model/analysis-payments'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisPayments(range: AnalysisRange) {
  const query = useGetV1AnalyticsPayments({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month',
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildAnalysisPaymentsViewModel(response, range) : null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    refetch: query.refetch,
  }
}
