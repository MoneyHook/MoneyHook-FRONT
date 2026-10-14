import type { V1PaymentsResponse } from '@/shared/api/generated/model'
import { getGetV1AnalyticsPaymentsQueryOptions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import type { AnalysisRange } from '../model/analysis-overview'
import { buildAnalysisPaymentsViewModel } from '../model/analysis-payments'

function isPaymentsResponse(value: unknown): value is V1PaymentsResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1PaymentsResponse).payment_list)
  )
}

export function useAnalysisPayments(range: AnalysisRange) {
  const parameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
  }
  const query = usePersistedApiQuery({
    isValue: isPaymentsResponse,
    parameters,
    resource: 'analysis-payments',
    queryOptions: getGetV1AnalyticsPaymentsQueryOptions(parameters),
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildAnalysisPaymentsViewModel(response, range) : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
