import type { V1FixedResponse } from '@/shared/api/generated/model'
import { getGetV1AnalyticsFixedQueryOptions } from '@/shared/api/generated/transaction/transaction'
import { usePersistedApiQuery } from '@/shared/hooks/use-persisted-api-query'

import { buildAnalysisFixedViewModel } from '../model/analysis-fixed'
import type { AnalysisRange } from '../model/analysis-overview'

function isFixedResponse(value: unknown): value is V1FixedResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1FixedResponse).category_list)
  )
}

export function useAnalysisFixed(range: AnalysisRange) {
  const parameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
  }
  const query = usePersistedApiQuery({
    isValue: isFixedResponse,
    parameters,
    resource: 'analysis-fixed',
    queryOptions: getGetV1AnalyticsFixedQueryOptions(parameters),
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildAnalysisFixedViewModel(response, range) : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
