import { useCallback, useEffect, useMemo } from 'react'

import {
  createPersistedQueryKey,
  readPersistedQueryData,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'

const CACHE_VERSION = 1

type SuccessfulResponse<T> = {
  data: T
  headers: Headers
  status: 200
}

export function usePersistedQueryData<T>({
  parameters,
  resource,
  isValue,
}: {
  parameters: unknown
  resource: string
  isValue: (value: unknown) => value is T
}) {
  const key = createPersistedQueryKey(resource, parameters)
  const cachedData = useMemo(
    () => readPersistedQueryData(key, CACHE_VERSION, isValue),
    [isValue, key],
  )

  const queryOptions = useMemo(() => cachedData
    ? {
        initialData: () => ({ data: cachedData, headers: new Headers(), status: 200 as const }),
        initialDataUpdatedAt: 0,
      }
    : {}, [cachedData])

  const persist = useCallback((response: unknown) => {
    if (
      response &&
      typeof response === 'object' &&
      'status' in response &&
      'data' in response &&
      response.status === 200 &&
      isValue(response.data)
    ) {
      writePersistedQueryData(key, CACHE_VERSION, response.data)
    }
  }, [isValue, key])

  return useMemo(() => ({
    cachedData,
    persist,
    queryOptions: queryOptions as { initialData?: () => SuccessfulResponse<T>; initialDataUpdatedAt?: number },
  }), [cachedData, persist, queryOptions])
}

export function usePersistedQueryRefresh(refetch: () => Promise<unknown>, enabled = true) {
  useEffect(() => {
    if (enabled) {
      void refetch()
    }
  // Query observers already deduplicate an in-flight request from initial mounting.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
