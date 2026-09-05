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

import { EditTransactionView } from './new-transaction-view'

const transaction = {
  transaction_id: '42',
  transaction_date: '2026-08-28',
  transaction_time: '12:30',
  transaction_name: 'ランチ',
  amount: 1_200,
  sign: -1,
  signed_amount: -1_200,
  category_id: '10',
  category_name: '食費',
  sub_category_id: '11',
  sub_category_name: '外食',
  fixed_flg: false,
  payment_id: '30',
  payment_name: '楽天カード',
}

const toastError = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: vi.fn(),
  },
}))

function registerHandlers({ deleteStatus = 204 } = {}) {
  let patchBody: unknown
  let deleteRequests = 0

  server.use(
    http.get('http://api.test/api/v1/transactions/42', () =>
      HttpResponse.json({ transaction }),
    ),
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({
        category_list: [
          {
            category_id: '10',
            category_name: '食費',
            sub_category_list: [
              { sub_category_id: '11', sub_category_name: '外食', enable: true },
              { sub_category_id: '12', sub_category_name: 'スーパー', enable: true },
            ],
          },
        ],
      }),
    ),
    http.get('http://api.test/api/payment/getPayment', () =>
      HttpResponse.json({
        payment_list: [
          { payment_id: '30', payment_name: '楽天カード', payment_type_id: '2' },
        ],
      }),
    ),
    http.get('http://api.test/api/payment/getPaymentType', () =>
      HttpResponse.json({
        payment_type_list: [
          { payment_type_id: '2', payment_type_name: 'カード', is_payment_due_later: true },
        ],
      }),
    ),
    http.patch('http://api.test/api/v1/transactions/42', async ({ request }) => {
      patchBody = await request.json()
      return HttpResponse.json({
        transaction: { ...transaction, transaction_date: '2026-09-02' },
        previous_transaction_date: transaction.transaction_date,
      })
    }),
    http.delete('http://api.test/api/v1/transactions/42', () => {
      deleteRequests += 1
      if (deleteStatus !== 204) {
        return HttpResponse.json({ message: '削除できませんでした' }, { status: deleteStatus })
      }
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return {
    getPatchBody: () => patchBody,
    getDeleteRequests: () => deleteRequests,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>
}

function renderEdit() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[{
          pathname: '/app/transactions/42/edit',
          state: { returnTo: '/app/analysis?view=categories&category=10#category-summary' },
        }]}
      >
        <EditTransactionView transactionId="42" />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EditTransactionView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 30, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    toastError.mockReset()
  })

  it('restores the transaction and sends an update payload including the original time', async () => {
    const handlers = registerHandlers()
    renderEdit()

    expect(await screen.findByRole('heading', { name: '取引を編集' })).toBeVisible()
    expect(screen.getByLabelText('金額')).toHaveValue('1200')
    expect(screen.getByLabelText('取引名')).toHaveValue('ランチ')
    expect(screen.getByRole('button', { name: /カテゴリ.*食費.*外食/ })).toBeVisible()
    expect(screen.getByText('楽天カード')).toBeVisible()

    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1500' } })
    fireEvent.change(screen.getByLabelText('取引名'), { target: { value: '昼食' } })
    fireEvent.click(screen.getByRole('button', { name: '日付' }))
    fireEvent.click(screen.getByRole('button', { name: '次の月へ' }))
    fireEvent.click(screen.getByRole('button', { name: /2026年9月2日/ }))
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(handlers.getPatchBody()).toEqual({
        transaction: {
          transaction_date: '2026-09-02',
          transaction_time: '12:30',
          transaction_name: '昼食',
          amount: 1500,
          sign: -1,
          category_id: '10',
          sub_category_id: '11',
          fixed_flg: false,
          payment_id: '30',
        },
      })
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/app/analysis?view=categories&category=10#category-summary',
      )
    })
  })

  it('does not delete until confirmed and returns to the source after deletion', async () => {
    const handlers = registerHandlers()
    renderEdit()

    await screen.findByRole('heading', { name: '取引を編集' })
    fireEvent.click(screen.getByRole('button', { name: '取引を削除' }))
    expect(screen.getByRole('alertdialog')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(handlers.getDeleteRequests()).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: '取引を削除' }))
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => {
      expect(handlers.getDeleteRequests()).toBe(1)
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/app/analysis?view=categories&category=10#category-summary',
      )
    })
  })

  it('keeps the editor open when deletion fails', async () => {
    registerHandlers({ deleteStatus: 500 })
    renderEdit()

    await screen.findByRole('heading', { name: '取引を編集' })
    fireEvent.click(screen.getByRole('button', { name: '取引を削除' }))
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('削除できませんでした'))
    expect(screen.getByRole('alertdialog')).toBeVisible()
  })
})
