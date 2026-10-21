import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/query-client'
import { getGetV1SettingsQueryKey } from '@/shared/api/generated/settings/settings'
import {
  createPersistedQueryKey,
  readPersistedQueryData,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'
import { server } from '@/test/msw/server'

import { isUserSettings, useUserSettings } from './use-user-settings'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: async () => 'test-token' },
  }),
}))

const key = createPersistedQueryKey('user-settings', {})
const cached = {
  theme_mode: 'system',
  accent_color: 'blue',
  chart_palette: 'default',
  default_transaction_scope: 'household',
} as const

beforeEach(() => localStorage.clear())

describe('user settings persistence contract', () => {
  it('uses cached settings while an existing query is pending, then persists the API result', async () => {
    writePersistedQueryData(key, 1, cached)
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const fresh = { ...cached, default_transaction_scope: 'personal' }
    server.use(
      http.get('http://api.test/api/v1/settings', async () => {
        await pending
        return HttpResponse.json(fresh)
      }),
    )
    const client = createAppQueryClient()
    // The appearance provider creates this query before the recording page mounts.
    client
      .getQueryCache()
      .build(client, { queryKey: getGetV1SettingsQueryKey() })
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    expect(result.current.data?.data).toEqual(cached)
    expect(result.current.isPending).toBe(false)
    release()
    await waitFor(() => expect(result.current.data?.data).toEqual(fresh))
    await waitFor(() =>
      expect(readPersistedQueryData(key, 1, isUserSettings)).toEqual(fresh),
    )
  })

  it('reuses fetched settings on remount and refreshes after a settings change', async () => {
    const request = vi.fn(() => HttpResponse.json(cached))
    server.use(http.get('http://api.test/api/v1/settings', request))
    const client = createAppQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const first = renderHook(() => useUserSettings(), { wrapper })
    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true)
      expect(first.result.current.isFetching).toBe(false)
    })
    expect(request).toHaveBeenCalledTimes(1)
    first.unmount()

    const second = renderHook(() => useUserSettings(), { wrapper })
    try {
      await waitFor(() => expect(second.result.current.isFetching).toBe(false))
      expect(second.result.current.data?.data).toEqual(cached)
      expect(request).toHaveBeenCalledTimes(1)

      await act(async () => {
        await client.invalidateQueries({ queryKey: getGetV1SettingsQueryKey() })
      })
      expect(request).toHaveBeenCalledTimes(2)
    } finally {
      second.unmount()
      client.clear()
    }
  })

  it('rejects invalid cache values', () => {
    for (const value of [
      null,
      {},
      { ...cached, default_transaction_scope: 'other' },
      { ...cached, theme_mode: 'other' },
    ]) {
      writePersistedQueryData(key, 1, value)
      expect(readPersistedQueryData(key, 1, isUserSettings)).toBeNull()
    }
  })
})
