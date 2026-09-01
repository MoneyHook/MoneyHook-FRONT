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

import { AnalysisCategoriesContent } from './analysis-categories'

function categoryResponse(empty = false) {
  const items = empty
    ? []
    : [
        ['食費', 180_000],
        ['住居', 150_000],
        ['交通', 90_000],
        ['娯楽', 70_000],
        ['日用品', 60_000],
        ['医療', 30_000],
        ['衣服', 20_000],
      ]
  const total = empty ? 0 : 600_000

  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    total_expense_amount: total,
    category_list: items.map(([category_name, expense_amount], index) => ({
      category_id: String(index + 1),
      category_name,
      expense_amount,
      ratio: (Number(expense_amount) / total) * 100,
      series: Array.from({ length: 6 }, (_, seriesIndex) => ({
        bucket: `2026-${String(seriesIndex + 3).padStart(2, '0')}-01`,
        expense_amount: Math.round(Number(expense_amount) / 6),
      })),
      sub_category_list:
        category_name === '食費'
          ? [
              ['外食', 120_000],
              ['スーパー', 60_000],
            ].map(([sub_category_name, subAmount], subIndex) => ({
              sub_category_id: `1${subIndex + 1}`,
              sub_category_name,
              expense_amount: subAmount,
              ratio: (Number(subAmount) / Number(expense_amount)) * 100,
              series: [],
              transaction_list: [],
            }))
          : [
              {
                sub_category_id: `${index + 1}1`,
                sub_category_name: `${category_name}その他`,
                expense_amount,
                ratio: 100,
                series: [],
                transaction_list: [],
              },
            ],
      transaction_list:
        category_name === '食費'
          ? [
              {
                transaction_id: '1',
                transaction_date: '2026-08-28',
                transaction_time: '12:30:00',
                transaction_name: 'ランチ',
                amount: 1_200,
                sign: -1,
                signed_amount: -1_200,
                category_id: '1',
                category_name: '食費',
                sub_category_id: '11',
                sub_category_name: '外食',
                fixed_flg: false,
                payment_id: '1',
                payment_name: '楽天カード',
              },
              {
                transaction_id: '2',
                transaction_date: '2026-08-27',
                transaction_time: '18:45:00',
                transaction_name: 'スーパー',
                amount: 3_480,
                sign: -1,
                signed_amount: -3_480,
                category_id: '1',
                category_name: '食費',
                sub_category_id: '12',
                sub_category_name: 'スーパー',
                fixed_flg: false,
                payment_id: '2',
                payment_name: 'PayPay',
              },
            ]
          : [],
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

function renderCategories(initialEntry = '/app/analysis?view=categories') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AnalysisCategoriesContent />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AnalysisCategoriesContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders category analysis and sends the fixed six-month range', async () => {
    const requests: string[] = []
    server.use(
      http.get('http://api.test/api/v1/analytics/categories', ({ request }) => {
        requests.push(request.url)
        return HttpResponse.json(categoryResponse())
      }),
    )
    renderCategories('/app/analysis?view=categories&month=2026-08-01')

    expect(
      await screen.findByRole('heading', { name: 'カテゴリ別支出' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '食費の内訳' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '食費の推移' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '食費の取引一覧' })).toBeVisible()
    expect(screen.getByText('ランチ')).toBeVisible()
    expect(
      screen
        .getAllByRole('button')
        .find((button) => button.getAttribute('aria-current') === 'true'),
    ).toHaveClass('bg-warning/10')
    expect(requests).toHaveLength(1)
    const params = new URL(requests[0]).searchParams
    expect(params.get('start_date')).toBe('2026-03-01')
    expect(params.get('end_date')).toBe('2026-08-31')
    expect(params.get('group_by')).toBe('month')
  })

  it('updates URL-backed controls and preserves unrelated parameters', async () => {
    const requests: string[] = []
    server.use(
      http.get('http://api.test/api/v1/analytics/categories', ({ request }) => {
        requests.push(request.url)
        return HttpResponse.json(categoryResponse())
      }),
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderCategories('/app/analysis?view=categories&metric=ratio&month=2026-08-01')
    await screen.findByRole('heading', { name: 'カテゴリ別支出' })

    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent('metric=')
    })
    expect(screen.queryByRole('button', { name: '金額' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '割合' })).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('month=2026-08-01')

    await user.click(
      screen.getByRole('button', { name: 'すべてのカテゴリを表示' }),
    )
    expect(screen.getByText('医療')).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('list=all')

    await user.click(screen.getByRole('button', { name: /住居/ }))
    expect(screen.getByRole('heading', { name: '住居の内訳' })).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('category=2')

    await user.selectOptions(
      screen.getByRole('combobox', { name: '推移の集計単位' }),
      'week',
    )
    expect(screen.getByTestId('location')).toHaveTextContent('group=week')
    await waitFor(() => {
      expect(
        requests.some(
          (request) =>
            new URL(request).searchParams.get('group_by') === 'week',
        ),
      ).toBe(true)
    })
  })

  it('removes invalid URL values and falls back to the largest category', async () => {
    server.use(
      http.get('http://api.test/api/v1/analytics/categories', () =>
        HttpResponse.json(categoryResponse()),
      ),
    )
    renderCategories(
      '/app/analysis?view=categories&metric=bad&group=quarter&list=bad&category=missing',
    )

    expect(
      await screen.findByRole('heading', { name: '食費の内訳' }),
    ).toBeVisible()
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('view=categories')
      expect(screen.getByTestId('location')).not.toHaveTextContent('metric=')
      expect(screen.getByTestId('location')).not.toHaveTextContent('group=')
      expect(screen.getByTestId('location')).not.toHaveTextContent('list=')
      expect(screen.getByTestId('location')).not.toHaveTextContent('category=')
    })
  })

  it('shows empty and retry states', async () => {
    let shouldFail = true
    server.use(
      http.get('http://api.test/api/v1/analytics/categories', () => {
        if (shouldFail) {
          shouldFail = false
          return HttpResponse.json({ message: '失敗しました' }, { status: 500 })
        }
        return HttpResponse.json(categoryResponse(true))
      }),
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderCategories()

    expect(
      await screen.findByText('カテゴリ分析を表示できません'),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'もう一度試す' }))
    expect(await screen.findByText('この期間の支出はありません')).toBeVisible()
  })

  it('opens the editor from a category transaction', async () => {
    server.use(
      http.get('http://api.test/api/v1/analytics/categories', () =>
        HttpResponse.json(categoryResponse()),
      ),
    )
    renderCategories('/app/analysis?view=categories&category=1')

    await screen.findByRole('button', { name: 'ランチを編集' })
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(
      screen.getByRole('button', { name: 'ランチを編集' }),
    )

    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/transactions/1/edit')
    expect(screen.getByTestId('return-to')).toHaveTextContent('/app/analysis?view=categories&category=1')
  })
})
