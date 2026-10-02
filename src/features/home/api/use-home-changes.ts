import { useEffect } from 'react'

import type { V1CategoriesResponse } from '@/shared/api/generated/model'
import { useGetV1AnalyticsCategories } from '@/shared/api/generated/transaction/transaction'
import { usePersistedQueryData } from '@/shared/hooks/use-persisted-query-data'

import {
  buildHomeChangesViewModel,
  createHomeChangeParameters,
} from '../model/home-changes'
import type { MonthContext } from '../model/home-dashboard'

function isCategoriesResponse(value: unknown): value is V1CategoriesResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as V1CategoriesResponse).category_list)
  )
}

export function useHomeChanges(month: MonthContext) {
  const parameters = createHomeChangeParameters(month)
  const currentCache = usePersistedQueryData({
    isValue: isCategoriesResponse,
    parameters: parameters.current,
    resource: 'analysis-categories',
  })
  const previousCache = usePersistedQueryData({
    isValue: isCategoriesResponse,
    parameters: parameters.previous,
    resource: 'analysis-categories',
  })
  const current = useGetV1AnalyticsCategories(parameters.current, {
    query: currentCache.queryOptions,
  })
  const previous = useGetV1AnalyticsCategories(parameters.previous, {
    query: previousCache.queryOptions,
  })
  useEffect(() => {
    currentCache.persist(current.data)
  }, [currentCache, current.data])
  useEffect(() => {
    previousCache.persist(previous.data)
  }, [previousCache, previous.data])

  const currentData = current.data?.status === 200 ? current.data.data : null
  const previousData = previous.data?.status === 200 ? previous.data.data : null
  const isPending = current.isPending || previous.isPending
  const isError = current.isError || previous.isError
  return {
    data:
      !isPending && !isError && currentData && previousData
        ? buildHomeChangesViewModel(currentData, previousData, month)
        : null,
    isPending,
    isError,
  }
}
