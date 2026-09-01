import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { V1FixedResponse } from '@/shared/api/generated/model'
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

import { AnalysisFixedContent } from './analysis-fixed'

function fixedResponse({ empty = false } = {}): V1FixedResponse {
  const categories = empty
    ? []
    : [
        { id: '1', name: '住居', amount: 300_000 },
        { id: '2', name: '通信', amount: 60_000 },
      ]

  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    summary: {
      expense_amount: empty ? 0 : 360_000,
      monthly_average: empty ? 0 : 60_000,
      annualized_amount: empty ? 0 : 720_000,
      total_expense_ratio: empty ? 0 : 50,
      latest_bucket_amount: empty ? 0 : 62_000,
      previous_bucket_amount: empty ? 0 : 60_000,
      difference_amount: empty ? 0 : 2_000,
      difference_rate: empty ? null : 3.3,
    },
    series: Array.from({ length: 6 }, (_, index) => ({
      bucket: `2026-${String(index + 3).padStart(2, '0')}-01`,
      expense_amount: empty ? 0 : 58_000 + index * 800,
    })),
    category_list: categories.map((category) => ({
      category_id: category.id,
      category_name: category.name,
      expense_amount: category.amount,
      ratio: (category.amount / 360_000) * 100,
      monthly_average: category.amount / 6,
      annualized_amount: category.amount * 2,
      series: Array.from({ length: 6 }, (_, index) => ({
        bucket: `2026-${String(index + 3).padStart(2, '0')}-01`,
        expense_amount: category.amount / 6 + index * 100,
      })),
      transaction_list: Array.from(
        { length: category.id === '1' ? 6 : 1 },
        (_, index) => ({
          transaction_id: `${category.id}${index + 1}`,
          transaction_date: `2026-08-${String(28 - index).padStart(2, '0')}`,
          transaction_time: '08:00:00',
          transaction_name:
            category.id === '1' ? `家賃関連${index + 1}` : '携帯電話',
          amount: category.id === '1' ? 50_000 : 10_000,
          sign: -1 as const,
          signed_amount: category.id === '1' ? -50_000 : -10_000,
          category_id: category.id,
          category_name: category.name,
          sub_category_id: `${category.id}0`,
          sub_category_name: category.id === '1' ? '家賃' : '携帯電話',
          fixed_flg: true,
          payment_id: '20',
          payment_name: '楽天カード',
        }),
      ),
    })),
  }
}

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <output data-testid="pathname">{location.pathname}</output>
      <output data-testid="location">{location.search}</output>
      <output data-testid="return-to">{String((location.state as { returnTo?: unknown } | null)?.returnTo ?? '')}</output>
    </>
  )
}

function renderFixed(initialEntry = '/app/analysis?view=fixed') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AnalysisFixedContent />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function registerHandler({
  empty = false,
  failOnce = false,
}: {
  empty?: boolean
  failOnce?: boolean
} = {}) {
  const requests: string[] = []
  let shouldFail = failOnce
  server.use(
    http.get('http://api.test/api/v1/analytics/fixed', ({ request }) => {
      requests.push(request.url)
      if (shouldFail) {
        shouldFail = false
        return HttpResponse.json(
          { message: '固定費の取得に失敗しました' },
          { status: 500 },
        )
      }
      return HttpResponse.json(fixedResponse({ empty }))
    }),
  )
  return requests
}

describe('AnalysisFixedContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the fixed-cost analysis and requests the six-month range', async () => {
    const requests = registerHandler()
    renderFixed()

    expect(
      await screen.findByRole('heading', { name: '固定費サマリー' }),
    ).toBeVisible()
    expect(screen.getByText('2026年3月1日 〜 2026年8月31日')).toBeVisible()
    expect(screen.getByText('¥720,000')).toBeVisible()
    expect(screen.getByRole('heading', { name: '固定費の内訳' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '固定費の推移' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '固定費のカテゴリ別推移' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '固定費の取引一覧' })).toBeVisible()
    expect(screen.getByText('家賃関連1')).toBeVisible()
    expect(screen.queryByText('家賃関連6')).not.toBeInTheDocument()

    expect(requests).toHaveLength(1)
    const params = new URL(requests[0]).searchParams
    expect(params.get('start_date')).toBe('2026-03-01')
    expect(params.get('end_date')).toBe('2026-08-31')
    expect(params.get('group_by')).toBe('month')
  })

  it('filters categories and persists canonical URL state', async () => {
    registerHandler()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderFixed('/app/analysis?view=fixed&metric=ratio&fixedCategory=invalid')

    await screen.findByRole('heading', { name: '固定費サマリー' })
    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent(
        'fixedCategory',
      )
      expect(screen.getByTestId('location')).not.toHaveTextContent('metric=')
    })
    expect(screen.queryByRole('button', { name: '金額' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '割合' })).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'カテゴリを選択、2件選択中' }),
    )
    await user.click(screen.getByRole('menuitemcheckbox', { name: /通信/ }))
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        'fixedCategory=1',
      )
    })
    expect(screen.getByText('選択カテゴリ合計')).toBeVisible()
    expect(screen.queryByText('携帯電話')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'カテゴリを選択、1件選択中' }),
    )
    expect(
      screen.getByRole('menuitemcheckbox', { name: /住居/ }),
    ).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('menuitem', { name: /すべて選択/ }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent(
        'fixedCategory',
      )
    })
  })

  it('expands and collapses the complete transaction list', async () => {
    registerHandler()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderFixed()

    const expand = await screen.findByRole('button', {
      name: 'すべて表示（7件）',
    })
    await user.click(expand)
    expect(screen.getByText('家賃関連6')).toBeVisible()

    await user.click(screen.getByRole('button', { name: '最新5件に戻す' }))
    expect(screen.queryByText('家賃関連6')).not.toBeInTheDocument()
  })

  it('shows empty and retry states', async () => {
    registerHandler({ failOnce: true, empty: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderFixed()

    expect(await screen.findByText('固定費分析を表示できません')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'もう一度試す' }))
    expect(await screen.findByText('この期間の固定費はありません')).toBeVisible()
  })

  it('opens the editor from a fixed-cost transaction', async () => {
    registerHandler()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderFixed('/app/analysis?view=fixed&metric=amount')

    await user.click(await screen.findByRole('button', { name: '家賃関連1を編集' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/transactions/11/edit')
    expect(screen.getByTestId('return-to')).toHaveTextContent('/app/analysis?view=fixed')
  })
})
