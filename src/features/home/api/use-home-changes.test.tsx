import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { V1CategoriesResponse } from '@/shared/api/generated/model'
import {
  createPersistedQueryKey,
  readPersistedQueryData,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'
import { server } from '@/test/msw/server'

import { invalidateTransactionQueries } from '../../transactions/api/invalidate-transaction-queries'
import { createHomeChangeParameters } from '../model/home-changes'
import { createMonthContext } from '../model/home-dashboard'
import { useHomeChanges } from './use-home-changes'
import { useHomeDashboard } from './use-home-dashboard'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: async () => 'test-token' },
  }),
}))

beforeEach(() => localStorage.clear())

const month = createMonthContext('2026-10-01', new Date(2026, 9, 10))
const endpoint = 'http://api.test/api/v1/analytics/categories'

function response(amount: number): V1CategoriesResponse {
  return {
    range: { start_date: '2026-10-01', end_date: '2026-10-10' },
    total_expense_amount: amount,
    category_list: [
      {
        category_id: 'food',
        category_name: '食費',
        expense_amount: amount,
        ratio: 100,
        series: [],
        sub_category_list: [],
        transaction_list: [
          {
            transaction_id: '1',
            transaction_date: '2026-10-01',
            transaction_time: null,
            transaction_name: '食料品',
            amount,
            sign: -1,
            signed_amount: -amount,
            category_id: 'food',
            category_name: '食費',
            sub_category_id: '1',
            sub_category_name: '食料品',
            fixed_flg: false,
            payment_id: null,
            payment_name: null,
          },
        ],
      },
    ],
  }
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

describe('home changes API integration', () => {
  it('requests the two exact periods and persists results in the existing categories cache', async () => {
    const requests: Record<string, string>[] = []
    server.use(
      http.get(endpoint, ({ request }) => {
        const parameters = Object.fromEntries(new URL(request.url).searchParams)
        requests.push(parameters)
        return HttpResponse.json(
          response(parameters.start_date === '2026-10-01' ? 18_000 : 15_000),
        )
      }),
    )
    const { wrapper } = setup()
    const { result } = renderHook(() => useHomeChanges(month), { wrapper })
    expect(result.current.data).toBeNull()
    await waitFor(() =>
      expect(result.current.data?.increase?.difference).toBe(3_000),
    )
    const parameters = createHomeChangeParameters(month)
    expect(requests).toHaveLength(2)
    expect(requests).toEqual(
      expect.arrayContaining([parameters.current, parameters.previous]),
    )
    await waitFor(() =>
      expect(
        readPersistedQueryData(
          createPersistedQueryKey('analysis-categories', parameters.current),
          1,
          (value): value is V1CategoriesResponse => Boolean(value),
        ),
      ).toEqual(response(18_000)),
    )
  })

  it('hides changes while one response is still loading', async () => {
    let resolvePrevious!: (value: Response) => void
    const previousResponse = new Promise<Response>((resolve) => {
      resolvePrevious = resolve
    })
    server.use(
      http.get(endpoint, ({ request }) => {
        if (
          new URL(request.url).searchParams.get('start_date') === '2026-09-01'
        ) {
          return previousResponse
        }
        return HttpResponse.json(response(18_000))
      }),
    )
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useHomeChanges(month), { wrapper })
    await waitFor(() =>
      expect(
        client
          .getQueryCache()
          .findAll()
          .some((query) => query.state.status === 'success'),
      ).toBe(true),
    )
    expect(result.current.isPending).toBe(true)
    expect(result.current.data).toBeNull()
    resolvePrevious(HttpResponse.json(response(15_000)))
    await waitFor(() =>
      expect(result.current.data?.increase?.difference).toBe(3_000),
    )
  })

  it('hides changes after a failed refresh even if persisted data is available, without failing the dashboard', async () => {
    const parameters = createHomeChangeParameters(month)
    writePersistedQueryData(
      createPersistedQueryKey('analysis-categories', parameters.current),
      1,
      response(18_000),
    )
    writePersistedQueryData(
      createPersistedQueryKey('analysis-categories', parameters.previous),
      1,
      response(15_000),
    )
    server.use(
      http.get(endpoint, () => new HttpResponse(null, { status: 500 })),
      http.get('http://api.test/api/v1/analytics/overview', () =>
        HttpResponse.json({
          range: {},
          summary: {
            expense_amount: 0,
            fixed_expense_amount: 0,
            variable_expense_amount: 0,
          },
          series: [],
          category_changes: [],
        }),
      ),
      http.get('http://api.test/api/transaction/getHome', () =>
        HttpResponse.json({ balance: 0, category_list: [] }),
      ),
      http.get('http://api.test/api/v1/analytics/fixed', () =>
        HttpResponse.json({
          range: {},
          summary: {
            expense_amount: 0,
            annualized_amount: 0,
            total_expense_ratio: 0,
          },
          series: [],
          category_list: [],
        }),
      ),
      http.get('http://api.test/api/v1/budget', () =>
        HttpResponse.json({
          monthly_budget_amount: null,
          effective_from: null,
        }),
      ),
    )
    const { wrapper } = setup()
    const { result } = renderHook(
      () => ({
        dashboard: useHomeDashboard(month),
        changes: useHomeChanges(month),
      }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.changes.isError).toBe(true))
    await waitFor(() => expect(result.current.dashboard.data).not.toBeNull())
    expect(result.current.changes.data).toBeNull()
    expect(result.current.dashboard.isError).toBe(false)
    expect(result.current.dashboard.isPending).toBe(false)
  })

  it('refetches both comparison periods after transaction invalidation', async () => {
    let amount = 18_000
    let count = 0
    server.use(
      http.get(endpoint, ({ request }) => {
        count += 1
        return HttpResponse.json(
          response(
            new URL(request.url).searchParams.get('start_date') === '2026-10-01'
              ? amount
              : 15_000,
          ),
        )
      }),
    )
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useHomeChanges(month), { wrapper })
    await waitFor(() =>
      expect(result.current.data?.increase?.difference).toBe(3_000),
    )
    amount = 24_000
    await act(async () => {
      await invalidateTransactionQueries(client)
    })
    await waitFor(() =>
      expect(result.current.data?.increase?.difference).toBe(9_000),
    )
    expect(count).toBe(4)
  })
})
