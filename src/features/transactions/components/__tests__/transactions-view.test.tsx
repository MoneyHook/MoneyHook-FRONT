import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
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

import { TransactionsView } from '../transactions-view'

const transactionList = [
  {
    transaction_id: '3',
    transaction_name: 'ランチ',
    transaction_amount: 1_200,
    transaction_sign: -1,
    transaction_date: '2024-08-28',
    category_id: '10',
    category_name: '食費',
    sub_category_id: '11',
    sub_category_name: '外食',
    fixed_flg: false,
    payment_id: '20',
    payment_name: '楽天カード',
  },
  {
    transaction_id: '2',
    transaction_name: 'スーパー',
    transaction_amount: 3_480,
    transaction_sign: -1,
    transaction_date: '2024-08-28',
    category_id: '12',
    category_name: '日用品',
    sub_category_id: '13',
    sub_category_name: 'スーパー',
    fixed_flg: false,
    payment_id: '21',
    payment_name: 'PayPay',
  },
  {
    transaction_id: '1',
    transaction_name: '給与（8月分）',
    transaction_amount: 25_000,
    transaction_sign: 1,
    transaction_date: '2024-08-26',
    category_id: '14',
    category_name: '収入',
    sub_category_id: '15',
    sub_category_name: '給与',
    fixed_flg: true,
    payment_id: null,
    payment_name: '銀行振込',
  },
]

function registerHandler({ empty = false, failOnce = false } = {}) {
  let shouldFail = failOnce
  server.use(
    http.get('http://api.test/api/transaction/getTimelineData', () => {
      if (shouldFail) {
        shouldFail = false
        return HttpResponse.json({ message: '取得に失敗しました' }, { status: 500 })
      }
      return HttpResponse.json({ transaction_list: empty ? [] : transactionList })
    }),
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({
        category_list: [
          { category_id: '10', category_name: '食費', sub_category_list: [] },
          { category_id: '12', category_name: '日用品', sub_category_list: [] },
          { category_id: '14', category_name: '収入', sub_category_list: [] },
        ],
      }),
    ),
    http.get('http://api.test/api/payment/getPayment', () =>
      HttpResponse.json({
        payment_list: [
          { payment_id: '20', payment_name: '楽天カード', payment_type_id: '2', payment_date: null, closing_date: 31 },
          { payment_id: '21', payment_name: 'PayPay', payment_type_id: '2', payment_date: null, closing_date: 31 },
        ],
      }),
    ),
  )
}

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <output data-testid="pathname">{location.pathname}</output>
      <output data-testid="location">{location.search}</output>
    </>
  )
}

function renderTransactions(initialEntry = '/app/transactions?month=2024-08-01&view=list') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <TransactionsView />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TransactionsView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders API-backed totals and grouped transactions', async () => {
    registerHandler()
    renderTransactions()

    expect(await screen.findByText('ランチ')).toBeVisible()
    expect(document.querySelector('[data-slot="transactions-scroll-area"]')).toHaveClass(
      'overflow-y-auto',
      'scrollbar-hidden',
    )
    expect(screen.getByText('+¥20,320')).toBeVisible()
    expect(screen.getByText('給与（8月分）')).toBeVisible()
    expect(screen.getAllByRole('button', { name: '取引を絞り込む' })[0]).toBeEnabled()
    const addTransactionButton = screen.getByRole('button', { name: '新しい取引を追加' })
    expect(addTransactionButton).toBeEnabled()
    expect(addTransactionButton).toHaveClass('fixed')

    fireEvent.click(addTransactionButton)
    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/app/transactions/new')
    })
  })

  it('opens the editor from a transaction row while preserving the list URL', async () => {
    registerHandler()
    renderTransactions('/app/transactions?month=2024-08-01&view=list')

    await screen.findByText('ランチ')
    fireEvent.click(screen.getByRole('button', { name: 'ランチを編集' }))

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/app/transactions/3/edit')
    })
  })

  it('switches to the calendar and selects the latest transaction in a past month', async () => {
    registerHandler()
    renderTransactions()
    await screen.findByText('ランチ')

    fireEvent.click(screen.getByRole('tab', { name: 'カレンダー' }))

    expect(await screen.findByText('2024年8月28日（水）')).toBeVisible()
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '?month=2024-08-01&view=calendar&date=2024-08-28',
      )
    })
    expect(screen.getByRole('button', { name: '8月28日（水）、取引2件' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('updates the month URL and clears the selected date', async () => {
    registerHandler()
    renderTransactions('/app/transactions?month=2024-08-01&view=calendar&date=2024-08-28')
    await screen.findByText('2024年8月28日（水）')

    fireEvent.click(screen.getByRole('button', { name: '対象月' }))
    fireEvent.click(screen.getByRole('button', { name: '2024年7月' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '?month=2024-07-01&view=calendar&date=2024-07-31',
      )
    })
  })

  it('shows an empty month state', async () => {
    registerHandler({ empty: true })
    renderTransactions()

    expect(await screen.findByText('この月の取引はありません')).toBeVisible()
    expect(screen.getAllByText('¥0')).toHaveLength(3)
  })

  it('offers retry after an API error', async () => {
    registerHandler({ failOnce: true })
    renderTransactions()

    expect(await screen.findByText('取引を表示できません')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'もう一度試す' }))

    expect(await screen.findByText('ランチ')).toBeVisible()
  })

  it('applies a category filter only after confirmation and preserves it in the URL', async () => {
    registerHandler()
    renderTransactions()
    await screen.findByText('ランチ')

    fireEvent.click(screen.getAllByRole('button', { name: '取引を絞り込む' })[0])
    expect(await screen.findByText('カテゴリ')).toBeVisible()
    fireEvent.click(await screen.findByRole('button', { name: '食費' }))
    expect(screen.getByText('スーパー')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '適用' }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('category=10')
    })
    expect(screen.getByText('ランチ')).toBeVisible()
    expect(screen.queryByText('スーパー')).not.toBeInTheDocument()
    expect(screen.getByText(/1件・支出/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '食費を解除' }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent('category=10')
    })
    expect(screen.getByText('スーパー')).toBeVisible()
  })

  it('opens the desktop filter sheet from its trigger', async () => {
    registerHandler()
    renderTransactions()
    await screen.findByText('ランチ')

    fireEvent.click(screen.getAllByRole('button', { name: '取引を絞り込む' })[1])
    expect(await screen.findByRole('heading', { name: '絞り込み' })).toBeVisible()
  })
})
