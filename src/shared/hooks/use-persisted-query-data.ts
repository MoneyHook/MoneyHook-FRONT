import { useCallback, useMemo } from 'react'

import {
  createPersistedQueryKey,
  getPersistedUserDataOwner,
  readPersistedQueryData,
  readPersistedUserData,
  writePersistedQueryData,
  writePersistedUserData,
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
  userDataKey,
  version = CACHE_VERSION,
}: {
  parameters: unknown
  resource: string
  isValue: (value: unknown) => value is T
  userDataKey?: string
  version?: number
}) {
  const key = createPersistedQueryKey(resource, parameters)
  const owner = getPersistedUserDataOwner()
  const cachedData = useMemo(
    () => {
      if (getPersistedUserDataOwner() !== owner) return null
      return userDataKey
        ? readPersistedUserData(userDataKey, version, isValue)
        : readPersistedQueryData(key, version, isValue)
    },
    [isValue, key, owner, userDataKey, version],
  )

  const queryOptions = useMemo(
    () =>
      cachedData
        ? {
            placeholderData: () => ({
              data: cachedData,
              headers: new Headers(),
              status: 200 as const,
            }),
          }
        : {},
    [cachedData],
  )

  const persist = useCallback(
    (response: unknown) => {
      if (getPersistedUserDataOwner() !== owner) return
      if (
        response &&
        typeof response === 'object' &&
        'status' in response &&
        'data' in response &&
        response.status === 200 &&
        isValue(response.data)
      ) {
        if (userDataKey) {
          writePersistedUserData(userDataKey, version, response.data)
        } else {
          writePersistedQueryData(key, version, response.data)
        }
      }
    },
    [isValue, key, owner, userDataKey, version],
  )

  return useMemo(
    () => ({
      cachedData,
      persist,
      queryOptions: queryOptions as {
        placeholderData?: () => SuccessfulResponse<T>
      },
    }),
    [cachedData, persist, queryOptions],
  )
}
