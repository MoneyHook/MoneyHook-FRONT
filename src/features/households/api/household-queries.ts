import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import * as api from '@/shared/api/generated/household/household'
import type { Household } from '@/shared/api/generated/model'
import { clearPersistedQueryData } from '@/shared/lib/persisted-user-data'

export { api }
export const householdKey = ['households'] as const
export function useHouseholds() {
  return useQuery({
    queryKey: householdKey,
    queryFn: async ({ signal }) => {
      const r = await api.householdList({ signal })
      if (r.status !== 200) throw new Error('家族を取得できません')
      return r.data
    },
    staleTime: 0,
    refetchOnWindowFocus: 'always',
  })
}
export function useFamilyData(id: string) {
  return useQuery({
    queryKey: [...householdKey, id, 'settings'],
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
      return {
        family: family.data,
        members: members.data,
        payments: payments.data,
        subcategories: subcategories.data,
      }
    },
    staleTime: 0,
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
