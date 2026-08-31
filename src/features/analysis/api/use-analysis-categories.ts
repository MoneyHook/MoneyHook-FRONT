import { useGetV1AnalyticsCategories } from '@/shared/api/generated/transaction/transaction'

import {
  buildAnalysisCategoriesViewModel,
  type CategoryGroup,
} from '../model/analysis-categories'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisCategories(
  range: AnalysisRange,
  group: CategoryGroup,
) {
  const query = useGetV1AnalyticsCategories({
    start_date: range.startDate,
    end_date: range.endDate,
    group_by: group,
  })
  const response = query.data?.status === 200 ? query.data.data : null

  return {
    data: response
      ? buildAnalysisCategoriesViewModel(response, range, group)
      : null,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    refetch: query.refetch,
  }
}
