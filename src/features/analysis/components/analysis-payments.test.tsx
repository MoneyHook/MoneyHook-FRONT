import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { V1PaymentsResponse } from '@/shared/api/generated/model'
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

import { AnalysisPaymentsContent } from './analysis-payments'

function paymentResponse({ empty = false } = {}): V1PaymentsResponse {
  if (empty) {
    return {
      range: { start_date: '2026-03-01', end_date: '2026-08-31' },
      total_expense_amount: 0,
      payment_list: [],
    }
  }

  return {
    range: { start_date: '2026-03-01', end_date: '2026-08-31' },
    total_expense_amount: 180_000,
    payment_list: [
      {
        payment_id: '1',
        payment_name: '楽天カード',
        payment_type_id: '2',
        payment_type_name: 'カード',
        is_payment_due_later: true,
        expense_amount: 120_000,
        ratio: 66.7,
        transaction_count: 6,
        average_amount: 20_000,
        series: Array.from({ length: 6 }, (_, index) => ({
          bucket: `2026-${String(index + 3).padStart(2, '0')}-01`,
          expense_amount: 17_500 + index * 1_000,
        })),
        transaction_list: Array.from({ length: 6 }, (_, index) => ({
          transaction_id: String(index + 1),
          transaction_date: `2026-08-${String(28 - index).padStart(2, '0')}`,
          transaction_time: '12:00:00',
          transaction_name: `楽天カード取引${index + 1}`,
          amount: 20_000,
          sign: -1 as const,
          signed_amount: -20_000,
          category_id: '1',
          category_name: '食費',
          sub_category_id: '10',
          sub_category_name: '外食',
          fixed_flg: false,
          payment_id: '1',
          payment_name: '楽天カード',
        })),
      },
      {
        payment_id: '2',
        payment_name: 'PayPay',
        payment_type_id: '3',
        payment_type_name: 'QRペイ',
        is_payment_due_later: false,
        expense_amount: 60_000,
        ratio: 33.3,
        transaction_count: 1,
        average_amount: 60_000,
        series: Array.from({ length: 6 }, (_, index) => ({
          bucket: `2026-${String(index + 3).padStart(2, '0')}-01`,
          expense_amount: 7_500 + index * 1_000,
        })),
        transaction_list: [
          {
            transaction_id: '20',
            transaction_date: '2026-08-20',
            transaction_time: null,
            transaction_name: 'PayPay取引',
            amount: 60_000,
            sign: -1,
            signed_amount: -60_000,
            category_id: '2',
            category_name: '日用品',
            sub_category_id: '20',
            sub_category_name: '生活用品',
            fixed_flg: false,
            payment_id: '2',
            payment_name: 'PayPay',
          },
        ],
      },
    ],
  }
}

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.search}
      {location.hash}
    </output>
  )
}

function renderPayments(initialEntry = '/app/analysis?view=payments') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AnalysisPaymentsContent />
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
    http.get('http://api.test/api/v1/analytics/payments', ({ request }) => {
      requests.push(request.url)
      if (shouldFail) {
        shouldFail = false
        return HttpResponse.json(
          { message: '支払い方法の取得に失敗しました' },
          { status: 500 },
        )
      }
      return HttpResponse.json(paymentResponse({ empty }))
    }),
  )
  return requests
}

describe('AnalysisPaymentsContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders payment analytics and requests the fixed six-month range', async () => {
    const requests = registerHandler()
    renderPayments()

    expect(
      await screen.findByRole('heading', { name: '支払い方法サマリー' }),
    ).toBeVisible()
    expect(screen.getByText('2026年3月1日 〜 2026年8月31日')).toBeVisible()
    expect(screen.getAllByText('¥180,000')[0]).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '支払い方法別の支出推移' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '支払い方法の詳細' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: '支払い方法の取引一覧を見る' })).toHaveAttribute(
      'href',
      '#payment-details',
    )

    expect(requests).toHaveLength(1)
    const params = new URL(requests[0]).searchParams
    expect(params.get('start_date')).toBe('2026-03-01')
    expect(params.get('end_date')).toBe('2026-08-31')
    expect(params.get('group_by')).toBe('month')
  })

  it('normalizes selection and expands and collapses payment transactions', async () => {
    registerHandler()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPayments('/app/analysis?view=payments&payment=missing')

    await screen.findByRole('heading', { name: '支払い方法サマリー' })
    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent('payment=')
    })

    const paymentRow = screen.getByRole('button', { name: /楽天カード/ })
    expect(paymentRow).toHaveAttribute('aria-expanded', 'false')
    await user.click(paymentRow)

    expect(screen.getByTestId('location')).toHaveTextContent('payment=1')
    expect(paymentRow).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('楽天カード取引1')).toBeVisible()
    expect(screen.queryByText('楽天カード取引6')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'すべて表示（6件）' }))
    expect(screen.getByText('楽天カード取引6')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '最新5件に戻す' }))
    expect(screen.queryByText('楽天カード取引6')).not.toBeInTheDocument()

    await user.click(paymentRow)
    expect(screen.getByTestId('location')).not.toHaveTextContent('payment=')
    expect(screen.queryByText('楽天カード取引1')).not.toBeInTheDocument()
  })

  it('shows empty and retry states', async () => {
    registerHandler({ failOnce: true, empty: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPayments()

    expect(
      await screen.findByText('支払い方法分析を表示できません'),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'もう一度試す' }))
    expect(await screen.findByText('この期間の支出はありません')).toBeVisible()
  })
})
