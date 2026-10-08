import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
