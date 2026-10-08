import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import * as api from '@/shared/api/generated/household/household'
import type { Household } from '@/shared/api/generated/model'
import { usePersistedQueryData } from '@/shared/hooks/use-persisted-query-data'
import {
  clearPersistedQueryData,
  createPersistedQueryKey,
  removePersistedUserData,
} from '@/shared/lib/persisted-user-data'

import {
  isFamilyData,
  isHouseholdList,
} from '../model/household-reference-cache'

export { api }
export const householdKey = ['households'] as const
export function useHouseholds() {
  const cache = usePersistedQueryData({
    resource: 'household-list',
    parameters: {},
    isValue: isHouseholdList,
  })
  return useQuery({
    queryKey: householdKey,
    initialData: cache.cachedData ?? undefined,
    initialDataUpdatedAt: 0,
    queryFn: async ({ signal }) => {
      const r = await api.householdList({ signal })
      if (r.status !== 200) throw new Error('家族を取得できません')
      if (signal.aborted) return r.data
      for (const previous of cache.cachedData ?? []) {
        if (
          !r.data.some(
            (family) => family.household_id === previous.household_id,
          )
        ) {
          removePersistedUserData(
            createPersistedQueryKey('household-settings', {
              id: previous.household_id,
            }),
          )
        }
      }
      cache.persist(r)
      return r.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  })
}
export function useFamilyData(id: string) {
  const cache = usePersistedQueryData({
    resource: 'household-settings',
    parameters: { id },
    isValue: isFamilyData,
  })
  return useQuery({
    queryKey: [...householdKey, id, 'settings'],
    initialData:
      cache.cachedData?.family.household_id === id
        ? cache.cachedData
        : undefined,
    initialDataUpdatedAt: 0,
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      const [family, members, payments, subcategories] = await Promise.all([
        api.householdGet(id, { signal }),
        api.householdMembers(id, { signal }),
        api.householdPayments(id, { signal }),
        api.householdSubcategories(id, { signal }),
      ])
      if (
        family.status !== 200 ||
        members.status !== 200 ||
        payments.status !== 200 ||
        subcategories.status !== 200
      )
        throw new Error('家族の情報を取得できません')
      const data = {
        family: family.data,
        members: members.data,
        payments: payments.data,
        subcategories: subcategories.data,
      }
      if (!signal.aborted) cache.persist({ status: 200, data })
      return data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  })
}
export function useHouseholdAction() {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      clearPersistedQueryData()
      await client.invalidateQueries()
      // Drop cached families after leave/removal; retained families keep their observers.
      const visible = new Set(
        client
          .getQueryData<Household[]>(householdKey)
          ?.map((f) => f.household_id),
      )
      client.removeQueries({
        predicate: (q) =>
          q.queryKey[0] === 'households' &&
          q.queryKey.length > 1 &&
          !visible.has(String(q.queryKey[q.queryKey[1] === 'entries' ? 2 : 1])),
      })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : '保存できませんでした',
      )
    },
  })
  return {
    run: mutation.mutateAsync,
    busy: mutation.isPending,
    error: mutation.error,
  }
}
// Keep a key for retries of the same payload; never reuse it for an edited draft.
export function useRequestKey() {
  const [keys] = useState(() => new Map<string, string>())
  const request = (body: unknown) => {
    const digest = JSON.stringify(body)
    let key = keys.get(digest)
    if (!key) {
      key = crypto.randomUUID()
      keys.set(digest, key)
    }
    return { headers: { 'Idempotency-Key': key } }
  }
  return Object.assign(request, {
    complete: (body: unknown) => keys.delete(JSON.stringify(body)),
  })
}
