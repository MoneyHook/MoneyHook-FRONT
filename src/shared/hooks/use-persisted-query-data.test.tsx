import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPersistedQueryKey,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'

import { usePersistedQueryData } from './use-persisted-query-data'

type CachedValue = { items: string[] }

function isCachedValue(value: unknown): value is CachedValue {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as CachedValue).items)
  )
}

describe('usePersistedQueryData', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders persisted data before refreshing it once', async () => {
    const resource = 'test-resource'
    const parameters = { month: '2026-09' }
    const cachedValue = { items: ['cached'] }
    writePersistedQueryData(
      createPersistedQueryKey(resource, parameters),
      1,
      cachedValue,
    )
    let resolveQuery: () => void
    const queryFn = vi.fn(
      () =>
        new Promise<{
          data: CachedValue
          headers: Headers
          status: 200
        }>((resolve) => {
          resolveQuery = () =>
            resolve({
              data: { items: ['api'] },
              headers: new Headers(),
              status: 200,
            })
        }),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { result } = renderHook(
      () => {
        const cache = usePersistedQueryData({
          isValue: isCachedValue,
          parameters,
          resource,
        })
        return useQuery({
          queryKey: [resource, parameters],
          queryFn,
          ...cache.queryOptions,
        })
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    )

    expect(result.current.data).toEqual({
      data: cachedValue,
      headers: expect.any(Headers),
      status: 200,
    })
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

    resolveQuery!()

    await waitFor(() =>
      expect(result.current.data).toEqual({
        data: { items: ['api'] },
        headers: expect.any(Headers),
        status: 200,
      }),
    )
  })
})
