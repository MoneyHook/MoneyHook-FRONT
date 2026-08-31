import { useGetV1AnalyticsFixed } from '@/shared/api/generated/transaction/transaction'

import { buildAnalysisFixedViewModel } from '../model/analysis-fixed'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisFixed(range: AnalysisRange) {
  const query = useGetV1AnalyticsFixed({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month',
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildAnalysisFixedViewModel(response, range) : null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    refetch: query.refetch,
  }
}
