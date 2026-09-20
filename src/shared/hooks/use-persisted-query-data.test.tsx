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

  it('uses persisted data without calling the query function', async () => {
    const resource = 'test-resource'
    const parameters = { month: '2026-09' }
    const cachedValue = { items: ['cached'] }
    writePersistedQueryData(
      createPersistedQueryKey(resource, parameters),
      1,
      cachedValue,
    )
    const queryFn = vi.fn(async () => ({
      data: { items: ['api'] },
      headers: new Headers(),
      status: 200 as const,
    }))
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

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))

    expect(result.current.data).toEqual({
      data: cachedValue,
      headers: expect.any(Headers),
      status: 200,
    })
    expect(queryFn).not.toHaveBeenCalled()
  })
})
