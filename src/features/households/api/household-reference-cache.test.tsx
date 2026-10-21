import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/query-client'
import {
  createPersistedQueryKey,
  ensurePersistedUserDataOwner,
  readPersistedQueryData,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'

import {
  isFamilyData,
  isHouseholdList,
} from '../model/household-reference-cache'
import {
  api,
  invalidateHouseholdQueries,
  useFamilyData,
  useHouseholds,
} from './household-queries'

vi.mock('@/shared/api/generated/household/household', () => ({
  householdList: vi.fn(),
  householdGet: vi.fn(),
  householdMembers: vi.fn(),
  householdPayments: vi.fn(),
  householdSubcategories: vi.fn(),
}))

const family = {
  household_id: 'family-1',
  name: '家族',
  state: 'active',
  version: 1,
  created_at: '2026-10-01',
  archived_at: null,
  role: 'admin',
  member_id: 'member-1',
} as const
const detail = { family, members: [], payments: [], subcategories: [] }
const listKey = createPersistedQueryKey('household-list', {})
const detailKey = createPersistedQueryKey('household-settings', {
  id: family.household_id,
})
function success<T>(data: T) {
  return { status: 200 as const, data, headers: new Headers() }
}
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createAppQueryClient()}>
      {children}
    </QueryClientProvider>
  )
}
function useFamilyReferences() {
  return useFamilyData(family.household_id)
}
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('household reference persistence contract', () => {
  it.each([
    ['list', useHouseholds],
    ['references', useFamilyReferences],
  ] as const)(
    'reuses fetched %s on remount and refreshes after changes',
    async (resource, useRead) => {
      vi.mocked(api.householdList).mockResolvedValue(success([family]))
      vi.mocked(api.householdGet).mockResolvedValue(success(family))
      vi.mocked(api.householdMembers).mockResolvedValue(success([]))
      vi.mocked(api.householdPayments).mockResolvedValue(success([]))
      vi.mocked(api.householdSubcategories).mockResolvedValue(success([]))
      const requests =
        resource === 'list'
          ? [api.householdList]
          : [
              api.householdGet,
              api.householdMembers,
              api.householdPayments,
              api.householdSubcategories,
            ]
      const client = createAppQueryClient()
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
      const useQueryStatus = () => {
        const query = useRead()
        return { isSuccess: query.isSuccess, isFetching: query.isFetching }
      }
      const first = renderHook(useQueryStatus, { wrapper })
      await waitFor(() => {
        expect(first.result.current.isSuccess).toBe(true)
        expect(first.result.current.isFetching).toBe(false)
      })
      requests.forEach((request) => expect(request).toHaveBeenCalledTimes(1))
      first.unmount()

      const second = renderHook(useQueryStatus, { wrapper })
      try {
        await waitFor(() =>
          expect(second.result.current.isFetching).toBe(false),
        )
        requests.forEach((request) => expect(request).toHaveBeenCalledTimes(1))
        await act(async () => {
          await invalidateHouseholdQueries(client, {
            householdList: resource === 'list',
          })
        })
        requests.forEach((request) => expect(request).toHaveBeenCalledTimes(2))
      } finally {
        second.unmount()
        client.clear()
      }
    },
  )

  it('restores a family list immediately and replaces it after fetching, removing departed-family cache', async () => {
    writePersistedQueryData(listKey, 1, [family])
    writePersistedQueryData(detailKey, 1, detail)
    let release!: () => void
    vi.mocked(api.householdList).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(success([]))
        }),
    )
    const { result } = renderHook(() => useHouseholds(), { wrapper })
    expect(result.current.data).toEqual([family])
    expect(result.current.isPending).toBe(false)
    release()
    await waitFor(() => expect(result.current.data).toEqual([]))
    expect(readPersistedQueryData(listKey, 1, isHouseholdList)).toEqual([])
    expect(localStorage.getItem(detailKey)).toBeNull()
  })

  it('restores family form references while all four API requests are pending, then refreshes them', async () => {
    writePersistedQueryData(detailKey, 1, detail)
    const freshFamily = { ...family, name: '新しい家族名', version: 2 }
    let release!: () => void
    vi.mocked(api.householdGet).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(success(freshFamily))
        }),
    )
    vi.mocked(api.householdMembers).mockResolvedValue(success([]))
    vi.mocked(api.householdPayments).mockResolvedValue(success([]))
    vi.mocked(api.householdSubcategories).mockResolvedValue(success([]))
    const { result } = renderHook(() => useFamilyData(family.household_id), {
      wrapper,
    })
    expect(result.current.data).toEqual(detail)
    release()
    await waitFor(() =>
      expect(result.current.data?.family).toEqual(freshFamily),
    )
    expect(readPersistedQueryData(detailKey, 1, isFamilyData)?.family).toEqual(
      freshFamily,
    )
  })

  it('rejects malformed references and clears them when the user changes', () => {
    writePersistedQueryData(detailKey, 1, { ...detail, payments: [{}] })
    expect(readPersistedQueryData(detailKey, 1, isFamilyData)).toBeNull()
    ensurePersistedUserDataOwner('user-1')
    writePersistedQueryData(detailKey, 1, detail)
    writePersistedQueryData(listKey, 1, [family])
    ensurePersistedUserDataOwner('user-2')
    expect(localStorage.getItem(detailKey)).toBeNull()
    expect(localStorage.getItem(listKey)).toBeNull()
  })
})
