import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { householdKey, invalidateHouseholdQueries } from './household-queries'

describe('household mutation query refresh', () => {
  it.each([
    { options: {}, householdList: false, userSettings: false },
    {
      options: { householdList: true },
      householdList: true,
      userSettings: false,
    },
    {
      options: { userSettings: true },
      householdList: false,
      userSettings: true,
    },
    {
      options: { householdList: true, userSettings: true },
      householdList: true,
      userSettings: true,
    },
  ])(
    'only refreshes the list=$householdList and settings=$userSettings when requested',
    async ({ options, householdList, userSettings }) => {
      const client = new QueryClient()
      const queries = [
        {
          queryKey: householdKey,
          initialData: [{ household_id: 'family-1' }],
          refresh: householdList,
        },
        {
          queryKey: ['/api/v1/settings'],
          initialData: { theme_mode: 'light' },
          refresh: userSettings,
        },
        {
          queryKey: ['/api/v1/transactions', 'family-sharing', 'family-1'],
          initialData: { transactions: [] },
          refresh: true,
        },
        {
          queryKey: [
            'households',
            'entries',
            'family-1',
            '2026-10',
            'complete',
          ],
          initialData: { entries: [] },
          refresh: true,
        },
        {
          queryKey: ['households', 'family-1', 'settings'],
          initialData: { members: [], payments: [], subcategories: [] },
          refresh: true,
        },
      ].map(({ queryKey, initialData, refresh }) => {
        const queryFn = vi.fn(async (): Promise<unknown> => initialData)
        const observer = new QueryObserver(client, {
          queryKey,
          initialData,
          queryFn,
          staleTime: Infinity,
        })
        return {
          queryKey,
          queryFn,
          refresh,
          unsubscribe: observer.subscribe(() => {}),
        }
      })
      const inactiveKey = ['households', 'entries', 'family-1', '2026-09']
      const departedKey = ['households', 'entries', 'family-2', '2026-10']
      client.setQueryData(inactiveKey, { cached: true })
      client.setQueryData(departedKey, { cached: true })
      try {
        await invalidateHouseholdQueries(client, options)
        for (const query of queries) {
          expect(query.queryFn).toHaveBeenCalledTimes(query.refresh ? 1 : 0)
          expect(client.getQueryState(query.queryKey)?.isInvalidated).toBe(
            false,
          )
        }
        // Off-screen records become stale without an immediate request.
        expect(client.getQueryState(inactiveKey)?.isInvalidated).toBe(true)
        // Only a refreshed membership list can determine which caches to remove.
        expect(client.getQueryData(departedKey)).toEqual(
          householdList ? undefined : { cached: true },
        )
      } finally {
        queries.forEach(({ unsubscribe }) => unsubscribe())
        client.clear()
      }
    },
  )
})
