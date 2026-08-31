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

import { NewTransactionView } from './new-transaction-view'

const categories = [
  {
    category_id: '10',
    category_name: '食費',
    sub_category_list: [
      { sub_category_id: '11', sub_category_name: '外食', enable: true },
      { sub_category_id: '12', sub_category_name: 'スーパー', enable: true },
    ],
  },
  {
    category_id: '20',
    category_name: '収入',
    sub_category_list: [{ sub_category_id: '21', sub_category_name: '給与', enable: true }],
  },
]

function registerHandlers({ createStatus = 201 } = {}) {
  server.use(
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({ category_list: categories }),
    ),
    http.get('http://api.test/api/payment/getPayment', () =>
      HttpResponse.json({
        payment_list: [
          { payment_id: '30', payment_name: '楽天カード', payment_type_id: '1', payment_date: 27, closing_date: 31 },
        ],
      }),
    ),
    http.get('http://api.test/api/transaction/getFrequentTransactionName', () =>
      HttpResponse.json({
        transaction_list: [
          {
            transaction_name: 'ランチ',
            category_id: '10',
            sub_category_id: '11',
            fixed_flg: false,
            payment_id: '30',
            category_name: '食費',
            sub_category_name: '外食',
          },
        ],
      }),
    ),
    http.post('http://api.test/api/v1/transactions', async ({ request }) => {
      if (createStatus !== 201) {
        return HttpResponse.json({ message: '保存に失敗しました' }, { status: createStatus })
      }
      const body = await request.json()
      return HttpResponse.json({ transaction: body }, { status: 201 })
    }),
    http.get('http://api.test/api/transaction/getTimelineData', () =>
      HttpResponse.json({ transaction_list: [] }),
    ),
  )
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderNewTransaction() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/app/transactions/new']}>
        <NewTransactionView />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewTransactionView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows validation errors for an incomplete form', async () => {
    registerHandlers()
    renderNewTransaction()

    await screen.findByText('よく使うカテゴリ')
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('金額は1〜9,999,999円の整数で入力してください。')).toBeVisible()
    expect(screen.getByText('取引名は1〜32文字で入力してください。')).toBeVisible()
    expect(screen.getByText('カテゴリを選択してください。')).toBeVisible()
  })

  it('selects a frequent category and saves the API-compatible payload', async () => {
    let submittedBody: unknown
    registerHandlers()
    server.use(
      http.post('http://api.test/api/v1/transactions', async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json({ transaction: {} }, { status: 201 })
      }),
    )
    renderNewTransaction()

    await screen.findByRole('button', { name: '食費を選択' })
    fireEvent.click(screen.getByRole('button', { name: '食費を選択' }))
    expect(screen.getAllByText('食費').length).toBeGreaterThan(0)
    expect(screen.getByText('外食')).toBeVisible()

    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1200' } })
    fireEvent.change(screen.getByLabelText('取引名'), { target: { value: 'ランチ' } })
    fireEvent.click(screen.getByRole('tab', { name: '収入' }))
    fireEvent.click(screen.getByRole('switch', { name: '固定費フラグ' }))
    fireEvent.click(screen.getByRole('button', { name: '支払い方法選択しない' }))
    fireEvent.click(await screen.findByRole('button', { name: '楽天カード' }))
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(submittedBody).toEqual({
        transaction: {
          transaction_date: '2026-08-30',
          transaction_name: 'ランチ',
          amount: 1200,
          sign: 1,
          category_id: '10',
          sub_category_id: '11',
          fixed_flg: true,
          payment_id: '30',
        },
      })
      expect(screen.getByTestId('location')).toHaveTextContent('/app/transactions?month=2026-08-01&view=list')
    })
  })

  it('keeps entered values when saving fails', async () => {
    registerHandlers({ createStatus: 422 })
    renderNewTransaction()

    await screen.findByRole('button', { name: '食費を選択' })
    fireEvent.click(screen.getByRole('button', { name: '食費を選択' }))
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1200' } })
    fireEvent.change(screen.getByLabelText('取引名'), { target: { value: 'ランチ' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(screen.getByLabelText('取引名')).toHaveValue('ランチ'))
    expect(screen.getByLabelText('金額')).toHaveValue('1200')
  })
})
