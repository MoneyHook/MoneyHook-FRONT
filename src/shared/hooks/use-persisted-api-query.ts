import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { usePersistedQueryData } from './use-persisted-query-data'

export function usePersistedApiQuery<
  TResponse extends { data: unknown; status: number },
  TError = Error,
>({
  queryOptions,
  ...persistence
}: {
  queryOptions: UseQueryOptions<TResponse, TError>
  resource: string
  parameters: unknown
  isValue: (value: unknown) => value is TResponse['data']
  userDataKey?: string
  version?: number
}) {
  const cache = usePersistedQueryData(persistence)
  const queryFn = queryOptions.queryFn
  const placeholderData = cache.queryOptions.placeholderData?.() as
    TResponse | undefined
  const query = useQuery({
    ...queryOptions,
    placeholderData: (queryOptions.enabled === false
      ? undefined
      : placeholderData) as UseQueryOptions<
      TResponse,
      TError
    >['placeholderData'],
    queryFn:
      typeof queryFn === 'function'
        ? async (context) => {
            const signal = context.signal
            const response = await queryFn(context)
            if (!signal.aborted) cache.persist(response)
            return response
          }
        : queryFn,
  })
  const data = query.data ?? (query.isEnabled ? placeholderData : undefined)

  return {
    ...query,
    queryKey: queryOptions.queryKey,
    data,
    isPending: query.isPending && !data,
    isError: query.isError && !data,
  }
}
