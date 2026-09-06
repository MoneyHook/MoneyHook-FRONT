import { useEffect } from 'react'

import type { V1PaymentsResponse } from '@/shared/api/generated/model'
import { useGetV1AnalyticsPayments } from '@/shared/api/generated/transaction/transaction'
import { usePersistedQueryData, usePersistedQueryRefresh } from '@/shared/hooks/use-persisted-query-data'

import { buildAnalysisPaymentsViewModel } from '../model/analysis-payments'
import type { AnalysisRange } from '../model/analysis-overview'

function isPaymentsResponse(value: unknown): value is V1PaymentsResponse {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as V1PaymentsResponse).payment_list)
}

export function useAnalysisPayments(range: AnalysisRange) {
  const parameters = {
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: 'month' as const,
  }
  const cache = usePersistedQueryData({ isValue: isPaymentsResponse, parameters, resource: 'analysis-payments' })
  const query = useGetV1AnalyticsPayments(parameters, { query: cache.queryOptions })
  usePersistedQueryRefresh(query.refetch)
  useEffect(() => {
    cache.persist(query.data)
  }, [cache, query.data])
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response ? buildAnalysisPaymentsViewModel(response, range) : null,
    error: query.error,
    isError: query.isError && !response,
    isPending: query.isPending && !response,
    refetch: query.refetch,
  }
}
