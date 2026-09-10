import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getGetTimelineDataQueryKey,
  getGetV1TransactionQueryKey,
  getGetFrequentTransactionNamesQueryKey,
} from '@/shared/api/generated/transaction/transaction'
import { getGetPaymentResourcesQueryKey } from '@/shared/api/generated/payment/payment'
import {
  createPersistedQueryKey,
  readPersistedQueryData,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'
import { server } from '@/test/msw/server'
import { createNewTransactionValues } from '../model/new-transaction'
import { useTransactionFormMutations } from './use-transaction-form-mutations'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: { getIdToken: async () => 'test-token' } }),
}))

beforeEach(() => {
  localStorage.clear()
  server.use(
    http.post('http://api.test/api/v1/transactions', () =>
      HttpResponse.json({ transaction: {} }, { status: 201 }),
    ),
    http.patch('http://api.test/api/v1/transactions/42', () =>
      HttpResponse.json({ transaction: {}, previous_transaction_date: '2026-08-28' }),
    ),
    http.delete(
      'http://api.test/api/v1/transactions/42',
      () => new HttpResponse(null, { status: 204 }),
    ),
  )
})

describe('transaction mutation cache refresh', () => {
  it.each(['create', 'update', 'remove'] as const)(
    '%s refreshes transaction-dependent data without invalidating payment settings',
    async (operation) => {
      const queryClient = new QueryClient()
      const dependentKeys = [
        getGetTimelineDataQueryKey({ month: '2026-08-01' }),
        getGetTimelineDataQueryKey({ month: '2026-09-01' }),
        ['/api/transaction/getHome', { month: '2026-09-01' }],
        ['/api/v1/analytics/overview', { start_date: '2026-04-01', end_date: '2026-09-30' }],
        ['/api/v1/analytics/categories'],
        ['/api/v1/analytics/fixed'],
        ['/api/v1/analytics/payments'],
        getGetFrequentTransactionNamesQueryKey({ limit: 20 }),
        getGetFrequentTransactionNamesQueryKey({ limit: 100 }),
      ]
      const paymentKey = getGetPaymentResourcesQueryKey()
      const detailKey = getGetV1TransactionQueryKey('42')
      for (const queryKey of [...dependentKeys, paymentKey, detailKey])
        queryClient.setQueryData(queryKey, { cached: true })
      const persistedKey = createPersistedQueryKey('home-overview', { month: '2026-09-01' })
      writePersistedQueryData(persistedKey, 1, { amount: 100 })
      const { result } = renderHook(() => useTransactionFormMutations(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })
      const values = {
        ...createNewTransactionValues(new Date(2026, 8, 1)),
        transactionName: 'ランチ',
        amount: '1200',
        categoryId: '10',
        subcategoryId: '11',
      }
      await act(async () => {
        if (operation === 'create') await result.current.create(values)
        if (operation === 'update') await result.current.update('42', values)
        if (operation === 'remove') await result.current.remove('42')
      })
      for (const key of dependentKeys)
        expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(paymentKey)?.isInvalidated).toBe(false)
      expect(
        readPersistedQueryData(
          persistedKey,
          1,
          (value): value is object => typeof value === 'object' && value !== null,
        ),
      ).toBeNull()
      if (operation === 'update')
        expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
      if (operation === 'remove') expect(queryClient.getQueryData(detailKey)).toBeUndefined()
    },
  )
})
