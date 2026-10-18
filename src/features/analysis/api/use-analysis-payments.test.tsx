import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { V1PaymentsResponse } from '@/shared/api/generated/model'
import { getGetV1AnalyticsPaymentsQueryKey } from '@/shared/api/generated/transaction/transaction'
import {
  createPersistedQueryKey,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'
import { server } from '@/test/msw/server'

import type { PaymentGroup } from '../model/analysis-payments'
import { useAnalysisPayments } from './use-analysis-payments'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: async () => 'test-token' },
  }),
}))

const range = { startDate: '2026-10-01', endDate: '2026-10-18', label: '10月' }
const buckets = { month: '2026-10-01', week: '2026-10-12', day: '2026-10-18' }
const labels = { month: '10月', week: '10/12週', day: '10/18' }
const groups: PaymentGroup[] = ['month', 'week', 'day']
const parameters = (group: PaymentGroup) => ({
  start_date: range.startDate,
  end_date: range.endDate,
  group_by: group,
})

function response(group: PaymentGroup): V1PaymentsResponse {
  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    total_expense_amount: 1_000,
    payment_list: [
      {
        payment_id: 'cash',
        payment_name: '現金',
        payment_type_id: 'cash',
        payment_type_name: '現金',
        is_payment_due_later: false,
        expense_amount: 1_000,
        ratio: 100,
        transaction_count: 1,
        average_amount: 1_000,
        series: [{ bucket: buckets[group], expense_amount: 1_000 }],
        transaction_list: [],
      },
    ],
  }
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  }
}

beforeEach(() => localStorage.clear())

describe('payment analysis grouping API contract', () => {
  it('defaults to month and keeps request parameters and query caches separate when switching groups', async () => {
    const requests: Record<string, string>[] = []
    server.use(
      http.get('http://api.test/api/v1/analytics/payments', ({ request }) => {
        const params = new URL(request.url).searchParams
        requests.push(Object.fromEntries(params))
        return HttpResponse.json(
          response(params.get('group_by') as PaymentGroup),
        )
      }),
    )
    const { client, wrapper } = setup()
    const { result, rerender, unmount } = renderHook(
      ({ group }: { group?: PaymentGroup }) =>
        useAnalysisPayments(range, group),
      {
        wrapper,
        initialProps: { group: undefined } as { group?: PaymentGroup },
      },
    )
    for (const group of groups) {
      if (group !== 'month') rerender({ group })
      await waitFor(() =>
        expect(result.current.data?.payments[0].series[0].label).toBe(
          labels[group],
        ),
      )
      expect(
        client.getQueryData(
          getGetV1AnalyticsPaymentsQueryKey(parameters(group)),
        ),
      ).toMatchObject({ data: response(group) })
    }
    rerender({ group: 'month' })
    expect(result.current.data?.payments[0].series[0].label).toBe('10月')
    expect(requests).toEqual(groups.map(parameters))
    unmount()
    client.clear()
  })

  it.each(groups)(
    'restores only the persisted %s series when the API is unavailable',
    async (group) => {
      for (const cachedGroup of groups) {
        writePersistedQueryData(
          createPersistedQueryKey('analysis-payments', parameters(cachedGroup)),
          1,
          response(cachedGroup),
        )
      }
      server.use(
        http.get('http://api.test/api/v1/analytics/payments', () =>
          HttpResponse.json({}, { status: 503 }),
        ),
      )
      const { client, wrapper } = setup()
      const { result, unmount } = renderHook(
        () => useAnalysisPayments(range, group),
        { wrapper },
      )
      expect(result.current.data?.payments[0].series[0].label).toBe(
        labels[group],
      )
      await waitFor(() => expect(result.current.error).toBeDefined())
      expect(result.current.isError).toBe(false)
      expect(result.current.data?.payments[0].series[0].bucket).toBe(
        buckets[group],
      )
      unmount()
      client.clear()
    },
  )
})
