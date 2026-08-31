import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/test/msw/server'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))

vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: vi.fn(async () => 'test-token') },
  }),
}))

vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }
})

import { AnalysisDashboard } from './analysis-dashboard'

function overview(empty = false) {
  const expense = empty ? 0 : 600_000
  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    summary: {
      expense_amount: expense,
      income_amount: 0,
      net_amount: -expense,
      fixed_expense_amount: empty ? 0 : 330_000,
      variable_expense_amount: empty ? 0 : 270_000,
      monthly_average_expense: empty ? 0 : 100_000,
    },
    series: Array.from({ length: 6 }, (_, index) => ({
      bucket: `2026-${String(index + 3).padStart(2, '0')}-01`,
      expense_amount: empty ? 0 : 90_000 + index * 4_000,
      income_amount: 0,
      net_amount: empty ? 0 : -(90_000 + index * 4_000),
      fixed_expense_amount: empty ? 0 : 55_000,
      variable_expense_amount: empty ? 0 : 35_000 + index * 4_000,
    })),
    category_changes: empty
      ? []
      : [
          {
            category_id: '1',
            category_name: '食費',
            current_amount: 180_000,
            comparison_amount: 150_000,
            difference_amount: 30_000,
            difference_rate: 20,
          },
          {
            category_id: '2',
            category_name: '娯楽',
            current_amount: 80_000,
            comparison_amount: 100_000,
            difference_amount: -20_000,
            difference_rate: -20,
          },
          {
            category_id: '3',
            category_name: '住居',
            current_amount: 340_000,
            comparison_amount: 330_000,
            difference_amount: 10_000,
            difference_rate: 3,
          },
        ],
  }
}

function categories(empty = false) {
  const items = empty
    ? []
    : [
        ['食費', 180_000],
        ['住居', 150_000],
        ['娯楽', 90_000],
        ['交通', 80_000],
        ['その他カテゴリ', 100_000],
      ]
  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    total_expense_amount: empty ? 0 : 600_000,
    category_list: items.map(([category_name, expense_amount], index) => ({
      category_id: String(index + 1),
      category_name,
      expense_amount,
      ratio: 0,
      series: [],
      sub_category_list: [],
      transaction_list: [],
    })),
  }
}

function fixed(empty = false) {
  const items = empty
    ? []
    : [
        ['住居', 240_000],
        ['通信', 30_000],
        ['保険', 24_000],
        ['サブスク', 18_000],
        ['会費', 18_000],
      ]
  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    summary: {
      expense_amount: empty ? 0 : 330_000,
      monthly_average: empty ? 0 : 55_000,
      annualized_amount: empty ? 0 : 660_000,
      total_expense_ratio: empty ? 0 : 55,
      latest_bucket_amount: empty ? 0 : 60_000,
      previous_bucket_amount: empty ? 0 : 55_000,
      difference_amount: empty ? 0 : 5_000,
      difference_rate: empty ? null : 9.1,
    },
    series: [],
    category_list: items.map(([category_name, expense_amount], index) => ({
      category_id: String(index + 1),
      category_name,
      expense_amount,
      ratio: 0,
      monthly_average: 0,
      annualized_amount: 0,
      series: [],
      transaction_list: [],
    })),
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderDashboard(initialEntry = '/app/analysis') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AnalysisDashboard />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function registerHandlers({ empty = false, failOnce = false } = {}) {
  const requests: string[] = []
  let shouldFail = failOnce
  server.use(
    http.get('http://api.test/api/v1/analytics/overview', ({ request }) => {
      requests.push(request.url)
      if (shouldFail) {
        shouldFail = false
        return HttpResponse.json({ message: '分析に失敗しました' }, { status: 500 })
      }
      return HttpResponse.json(overview(empty))
    }),
    http.get('http://api.test/api/v1/analytics/categories', ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json(categories(empty))
    }),
    http.get('http://api.test/api/v1/analytics/fixed', ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json(fixed(empty))
    }),
    http.get('http://api.test/api/v1/analytics/payments', ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json({
        range: { start_date: '2026-03-01', end_date: '2026-08-31' },
        total_expense_amount: 0,
        payment_list: [],
      })
    }),
  )
  return requests
}

describe('AnalysisDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the API-backed six-month overview', async () => {
    const requests = registerHandlers()
    renderDashboard()

    expect(await screen.findByText('¥600,000')).toBeVisible()
    expect(screen.getByText('2026年3月1日 〜 2026年8月31日')).toBeVisible()
    expect(screen.getByText('カテゴリ別支出（上位5件）')).toBeVisible()
    expect(screen.getByText('固定費の内訳')).toBeVisible()
    expect(screen.getByText('支出の増減（前期間比）')).toBeVisible()
    expect(screen.getByRole('link', { name: '概要' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '概要' })).toHaveClass('text-primary')
    expect(screen.getByText('直近6か月')).toHaveClass('text-primary')

    expect(requests).toHaveLength(3)
    for (const request of requests) {
      const params = new URL(request).searchParams
      expect(params.get('start_date')).toBe('2026-03-01')
      expect(params.get('end_date')).toBe('2026-08-31')
      expect(params.get('group_by')).toBe('month')
    }
    expect(new URL(requests.find((request) => request.includes('/overview'))!).searchParams.get('compare')).toBe('previous_period')
  })

  it('switches tabs through the URL and fetches only the active analysis view', async () => {
    const requests = registerHandlers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderDashboard('/app/analysis?view=categories&month=2026-08-01')

    expect(
      await screen.findByRole('heading', { name: 'カテゴリ別支出' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '食費の内訳' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'カテゴリ' })).toHaveAttribute('aria-current', 'page')
    expect(requests).toHaveLength(1)
    expect(requests[0]).toContain('/api/v1/analytics/categories')

    await user.click(screen.getByRole('link', { name: '固定費' }))
    expect(
      await screen.findByRole('heading', { name: '固定費サマリー' }),
    ).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('view=fixed')
    expect(screen.getByTestId('location')).toHaveTextContent('month=2026-08-01')
    expect(requests).toHaveLength(2)
    expect(requests[1]).toContain('/api/v1/analytics/fixed')

    await user.click(screen.getByRole('link', { name: '支払い方法' }))
    expect(await screen.findByText('この期間の支出はありません')).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('view=payments')
    expect(requests).toHaveLength(3)
    expect(requests[2]).toContain('/api/v1/analytics/payments')
  })

  it('normalizes an unknown view and shows the overview', async () => {
    registerHandlers()
    renderDashboard('/app/analysis?view=unknown')

    expect(await screen.findByText('¥600,000')).toBeVisible()
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('view=overview')
    })
  })

  it('shows stable empty states', async () => {
    registerHandlers({ empty: true })
    renderDashboard()

    expect((await screen.findAllByText('¥0'))[0]).toBeVisible()
    expect(screen.getByText('この期間の支出はありません')).toBeVisible()
    expect(screen.getAllByText('該当する支出はありません')).toHaveLength(2)
  })

  it('offers a retry after an API error', async () => {
    registerHandlers({ failOnce: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderDashboard()

    expect(await screen.findByText('分析を表示できません')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'もう一度試す' }))
    expect(await screen.findByText('¥600,000')).toBeVisible()
  })
})
