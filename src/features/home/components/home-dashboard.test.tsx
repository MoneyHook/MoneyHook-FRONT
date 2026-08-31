import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

import { HomeDashboard } from './home-dashboard'

function overview(month: 'current' | 'previous', empty = false) {
  const isCurrent = month === 'current'
  const expense = empty ? 0 : isCurrent ? 184_320 : 170_290
  const bucket = isCurrent ? '2026-08-01' : '2026-07-01'
  return {
    range: {
      start_date: bucket,
      end_date: isCurrent ? '2026-08-31' : '2026-07-31',
    },
    summary: {
      expense_amount: expense,
      income_amount: 0,
      net_amount: -expense,
      fixed_expense_amount: empty ? 0 : isCurrent ? 92_000 : 88_000,
      variable_expense_amount: empty ? 0 : isCurrent ? 92_320 : 82_290,
      monthly_average_expense: expense,
    },
    series: empty
      ? []
      : [
          {
            bucket,
            expense_amount: expense,
            income_amount: 0,
            net_amount: -expense,
            fixed_expense_amount: 0,
            variable_expense_amount: expense,
          },
        ],
    category_changes: [],
  }
}

function home(month: 'current' | 'previous', empty = false) {
  const categories = empty
    ? []
    : month === 'current'
      ? [
          ['食費', 52_400],
          ['住居', 45_000],
          ['交通', 21_300],
          ['娯楽', 16_800],
          ['日用品', 9_200],
        ]
      : [
          ['食費', 40_000],
          ['住居', 45_000],
          ['交通', 18_500],
          ['娯楽', 23_100],
          ['日用品', 8_400],
        ]
  return {
    balance: -categories.reduce((total, [, amount]) => total + Number(amount), 0),
    category_list: categories.map(([category_name, amount]) => ({
      category_name,
      category_total_amount: -Number(amount),
      sub_category_list: [],
    })),
  }
}

function fixed(empty = false) {
  return {
    range: { start_date: '2026-08-01', end_date: '2026-08-31' },
    summary: {
      expense_amount: empty ? 0 : 92_000,
      monthly_average: empty ? 0 : 92_000,
      annualized_amount: empty ? 0 : 1_104_000,
      total_expense_ratio: empty ? 0 : 49.9,
      latest_bucket_amount: empty ? 0 : 92_000,
      previous_bucket_amount: 0,
      difference_amount: empty ? 0 : 92_000,
      difference_rate: null,
    },
    series: [],
    category_list: [],
  }
}

function registerHandlers({
  budgetAmount = 300_000,
  empty = false,
  failOnce = false,
}: { budgetAmount?: number | null; empty?: boolean; failOnce?: boolean } = {}) {
  let shouldFail = failOnce
  server.use(
    http.get('http://api.test/api/v1/analytics/overview', ({ request }) => {
      if (shouldFail) {
        shouldFail = false
        return HttpResponse.json({ message: '集計に失敗しました' }, { status: 500 })
      }
      const startDate = new URL(request.url).searchParams.get('start_date')
      return HttpResponse.json(
        overview(startDate === '2026-08-01' ? 'current' : 'previous', empty),
      )
    }),
    http.get('http://api.test/api/transaction/getHome', ({ request }) => {
      const month = new URL(request.url).searchParams.get('month')
      return HttpResponse.json(home(month === '2026-08-01' ? 'current' : 'previous', empty))
    }),
    http.get('http://api.test/api/v1/analytics/fixed', () =>
      HttpResponse.json(fixed(empty)),
    ),
    http.get('http://api.test/api/v1/budget', () =>
      HttpResponse.json({
        monthly_budget_amount: budgetAmount,
        effective_from: budgetAmount === null ? null : '2026-08-01',
      }),
    ),
  )
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderDashboard(initialEntry = '/app/home?month=2026-08-01') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <HomeDashboard />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomeDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 22, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders API-backed summary and analysis links', async () => {
    registerHandlers()
    renderDashboard()

    expect(await screen.findByText('¥184,320')).toBeVisible()
    expect(screen.getByText('61.4%')).toBeVisible()
    expect(screen.getByLabelText('予算比 61.4%')).toBeVisible()
    expect(screen.getByText('+¥14,030')).toBeVisible()
    expect(screen.getAllByText('食費')[0]).toBeVisible()
    expect(screen.getByRole('link', { name: /すべて見る/ })).toHaveAttribute(
      'href',
      '/app/analysis?view=categories&month=2026-08-01',
    )
    expect(screen.getByRole('button', { name: '通知（未対応）' })).toBeDisabled()
  })

  it('updates the month URL through the month input', async () => {
    registerHandlers()
    renderDashboard()
    await screen.findByText('¥184,320')

    fireEvent.change(screen.getByLabelText('対象月'), { target: { value: '2026-07' } })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('?month=2026-07-01')
    })
  })

  it('shows a stable empty state', async () => {
    registerHandlers({ empty: true })
    renderDashboard()

    expect((await screen.findAllByText('¥0'))[0]).toBeVisible()
    expect(screen.getByText('この月の支出はありません')).toBeVisible()
    expect(screen.getAllByText('該当する項目はありません')).toHaveLength(2)
  })

  it('shows the unset state when no monthly budget is configured', async () => {
    registerHandlers({ budgetAmount: null })
    renderDashboard()

    expect(await screen.findByText('未設定')).toBeVisible()
    expect(screen.getByLabelText('予算比は未設定です')).toBeVisible()
  })

  it('offers retry after an API error', async () => {
    registerHandlers({ failOnce: true })
    renderDashboard()

    expect(await screen.findByText('ホームを表示できません')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'もう一度試す' }))

    expect(await screen.findByText('¥184,320')).toBeVisible()
  })
})
