import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPersistedQueryData,
  createPersistedQueryKey,
  ensurePersistedUserDataOwner,
  readPersistedQueryData,
  readPersistedUserData,
  writePersistedQueryData,
  writePersistedUserData,
} from '@/shared/lib/persisted-user-data'

import { usePersistedApiQuery } from './use-persisted-api-query'

type Value = { items: string[] }
function isValue(value: unknown): value is Value {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as Value).items)
  )
}
function success(data: Value) {
  return { status: 200 as const, data, headers: new Headers() }
}
const key = createPersistedQueryKey('test', {})
const cached = { items: ['cached'] }
const fresh = { items: ['fresh'] }
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 60 * 1000 } },
  })
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  }
}
function pendingResponse() {
  let resolve!: (value: ReturnType<typeof success>) => void
  const promise = new Promise<ReturnType<typeof success>>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}
beforeEach(() => localStorage.clear())

describe('persisted display API queries', () => {
  it('restores storage without populating query data, then saves the successful API response', async () => {
    writePersistedQueryData(key, 1, cached)
    const pending = pendingResponse()
    const queryFn = vi.fn(() => pending.promise)
    const { client, wrapper } = setup()
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: { queryKey: ['test'], queryFn },
        }),
      { wrapper },
    )
    expect(result.current.data?.data).toEqual(cached)
    expect(result.current.isPending).toBe(false)
    expect(client.getQueryData(['test'])).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(true)
    expect(queryFn).toHaveBeenCalledTimes(1)
    pending.resolve(success(fresh))
    await waitFor(() => expect(result.current.data?.data).toEqual(fresh))
    expect(client.getQueryData(['test'])).toEqual(success(fresh))
    expect(readPersistedQueryData(key, 1, isValue)).toEqual(fresh)
  })

  it('prefers an existing query cache and does not save optimistic changes', async () => {
    writePersistedQueryData(key, 1, cached)
    const queryFn = vi.fn(async () => success(fresh))
    const { client, wrapper } = setup()
    client.setQueryData(['test'], success(fresh))
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: { queryKey: ['test'], queryFn },
        }),
      { wrapper },
    )
    expect(result.current.data?.data).toEqual(fresh)
    expect(queryFn).not.toHaveBeenCalled()
    act(() => client.setQueryData(['test'], success({ items: ['optimistic'] })))
    await waitFor(() =>
      expect(result.current.data?.data.items).toEqual(['optimistic']),
    )
    expect(readPersistedQueryData(key, 1, isValue)).toEqual(cached)
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['test'] })
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(readPersistedQueryData(key, 1, isValue)).toEqual(fresh)
  })

  it('keeps a storage fallback after an API failure without overwriting it', async () => {
    writePersistedQueryData(key, 1, cached)
    const { wrapper } = setup()
    const error = new Error('offline')
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: {
            queryKey: ['test'],
            queryFn: async (): Promise<ReturnType<typeof success>> => {
              throw error
            },
          },
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.error).toBe(error))
    expect(result.current.data?.data).toEqual(cached)
    expect(result.current.isPending).toBe(false)
    expect(readPersistedQueryData(key, 1, isValue)).toEqual(cached)
  })

  it('exposes an API failure when storage is unavailable', async () => {
    const { wrapper } = setup()
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: {
            queryKey: ['test'],
            queryFn: async (): Promise<ReturnType<typeof success>> => {
              throw new Error('offline')
            },
          },
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch or display stored data for a disabled query', () => {
    writePersistedQueryData(key, 1, cached)
    const queryFn = vi.fn(async () => success(fresh))
    const { wrapper } = setup()
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: { queryKey: ['test'], queryFn, enabled: false },
        }),
      { wrapper },
    )
    expect(result.current.data).toBeUndefined()
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('supports the existing versioned form-reference keys', async () => {
    const userDataKey = 'moneyhooks:user-cache:transaction-form:test'
    writePersistedUserData(userDataKey, 2, cached)
    const { wrapper } = setup()
    const { result } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          userDataKey,
          version: 2,
          queryOptions: {
            queryKey: ['test'],
            queryFn: async () => success(fresh),
          },
        }),
      { wrapper },
    )
    expect(result.current.data?.data).toEqual(cached)
    await waitFor(() => expect(result.current.data?.data).toEqual(fresh))
    expect(readPersistedUserData(userDataKey, 2, isValue)).toEqual(fresh)
  })

  it('does not repopulate storage after cancellation and cache cleanup', async () => {
    writePersistedQueryData(key, 1, cached)
    const pending = pendingResponse()
    const { client, wrapper } = setup()
    const { unmount } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: { queryKey: ['test'], queryFn: () => pending.promise },
        }),
      { wrapper },
    )
    unmount()
    client.clear()
    clearPersistedQueryData()
    await act(async () => pending.resolve(success(fresh)))
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('drops a mounted storage fallback when the authenticated owner changes', async () => {
    ensurePersistedUserDataOwner('user-a')
    writePersistedQueryData(key, 1, cached)
    const pending = pendingResponse()
    const queryFn = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(success(fresh))
    const { client, wrapper } = setup()
    const { result, rerender } = renderHook(
      () =>
        usePersistedApiQuery({
          resource: 'test',
          parameters: {},
          isValue,
          queryOptions: { queryKey: ['test'], queryFn },
        }),
      { wrapper },
    )
    expect(result.current.data?.data).toEqual(cached)
    act(() => {
      client.clear()
      ensurePersistedUserDataOwner('user-b')
    })
    rerender()
    expect(result.current.data).toBeUndefined()
    await waitFor(() => expect(result.current.data?.data).toEqual(fresh))
    await act(async () => pending.resolve(success(cached)))
    expect(readPersistedQueryData(key, 1, isValue)).toEqual(fresh)
  })
})
