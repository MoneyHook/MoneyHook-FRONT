import { useQuery } from '@tanstack/react-query'

import type { HouseholdEntry } from '@/shared/api/generated/model'

import { api, householdKey } from './household-queries'

export function useFamilyTransactions(id: string, month: string) {
  return useQuery({
    queryKey: [...householdKey, 'entries', id, month, 'complete'],
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const entries: HouseholdEntry[] = []
      let cursor = ''
      do {
        const response = await api.householdEntries(
          id,
          { month, cursor },
          { signal },
        )
        if (response.status !== 200)
          throw new Error('家族の取引を取得できませんでした')
        entries.push(...response.data.entries)
        cursor = response.data.next_cursor ?? ''
      } while (cursor)
      return entries
    },
  })
}
