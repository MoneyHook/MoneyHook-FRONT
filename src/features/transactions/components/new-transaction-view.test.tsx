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

function registerHandlers({ createStatus = 201, frequentStatus = 200 } = {}) {
  server.use(
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({ category_list: categories }),
    ),
    http.get('http://api.test/api/payment/getPayment', () =>
      HttpResponse.json({
        payment_list: [
          { payment_id: '30', payment_name: '楽天カード', payment_type_id: '2', payment_date: 27, closing_date: 31 },
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
    http.get('http://api.test/api/transaction/getFrequentTransactionName', () =>
      frequentStatus === 200
        ? HttpResponse.json({
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
          })
        : HttpResponse.json({ message: '候補を取得できませんでした' }, { status: frequentStatus }),
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

    await screen.findByText('取引候補')
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('金額は1〜9,999,999円の整数で入力してください。')).toBeVisible()
    expect(screen.getByText('取引名は1〜32文字で入力してください。')).toBeVisible()
    expect(screen.getByText('カテゴリを選択してください。')).toBeVisible()
  })

  it('applies a transaction candidate and saves the API-compatible payload', async () => {
    let submittedBody: unknown
    registerHandlers()
    server.use(
      http.post('http://api.test/api/v1/transactions', async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json({ transaction: {} }, { status: 201 })
      }),
    )
    renderNewTransaction()

    await screen.findByRole('button', { name: 'ランチを候補から適用' })
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1200' } })
    fireEvent.click(screen.getByRole('tab', { name: '収入' }))
    fireEvent.click(screen.getByRole('button', { name: 'ランチを候補から適用' }))
    expect(screen.getAllByText('食費').length).toBeGreaterThan(0)
    expect(screen.getByText('外食')).toBeVisible()

    expect(screen.getByLabelText('金額')).toHaveValue('1200')
    expect(screen.getByRole('tab', { name: '収入' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('switch', { name: '固定費フラグ' }))
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

  it('uses semantic colors for the selected transaction sign', async () => {
    registerHandlers()
    renderNewTransaction()

    const expenseTab = await screen.findByRole('tab', { name: '支出' })
    const incomeTab = screen.getByRole('tab', { name: '収入' })
    const saveButton = screen.getByRole('button', { name: '保存' })
    const candidateButton = screen.getByRole('button', { name: 'ランチを候補から適用' })
    const dateRow = screen.getByRole('button', { name: '日付' })

    expect(expenseTab).toHaveClass('bg-card', 'text-expense')
    fireEvent.click(incomeTab)
    expect(incomeTab).toHaveClass('bg-card', 'text-income')
    expect(saveButton).toHaveAttribute('data-variant', 'default')
    expect(saveButton).toHaveAttribute('data-size', 'lg')
    expect(saveButton).toHaveClass('w-full', 'sm:w-auto')
    expect(candidateButton).toHaveClass('min-h-16', 'rounded-xl', 'px-3', 'py-2')
    expect(candidateButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(dateRow).toHaveClass('min-h-16', 'w-full', 'border-b')
    expect(dateRow).toContainHTML('<svg')

    fireEvent.click(dateRow)
    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(screen.getByRole('button', { name: /2026年8月30日/ })).toBeVisible()
  })

  it('selects a category and subcategory in the same sheet', async () => {
    registerHandlers()
    renderNewTransaction()

    fireEvent.click(await screen.findByRole('button', { name: /カテゴリ.*選択してください.*サブカテゴリを選択/ }))
    fireEvent.click(screen.getByRole('button', { name: '食費' }))
    expect(await screen.findByRole('heading', { name: 'サブカテゴリを選択' })).toBeVisible()
    expect(screen.getByText('食費のサブカテゴリを選択してください。')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'カテゴリ選択へ戻る' }))
    expect(await screen.findByText('取引のカテゴリを選択してください。')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '収入' }))
    expect(await screen.findByText('収入のサブカテゴリを選択してください。')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '給与' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /カテゴリ.*収入.*給与/ })).toBeVisible())
  })

  it('keeps the form usable when loading transaction candidates fails', async () => {
    let submittedBody: unknown
    registerHandlers({ frequentStatus: 500 })
    server.use(
      http.post('http://api.test/api/v1/transactions', async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json({ transaction: {} }, { status: 201 })
      }),
    )
    renderNewTransaction()

    await screen.findByLabelText('金額')
    expect(screen.queryByText('取引候補')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '800' } })
    fireEvent.change(screen.getByLabelText('取引名'), { target: { value: '朝食' } })
    fireEvent.click(screen.getByRole('button', { name: /カテゴリ.*選択してください.*サブカテゴリを選択/ }))
    fireEvent.click(screen.getByRole('button', { name: '食費' }))
    fireEvent.click(await screen.findByRole('button', { name: '外食' }))
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(submittedBody).toEqual(expect.objectContaining({
      transaction: expect.objectContaining({ transaction_name: '朝食', category_id: '10', sub_category_id: '11' }),
    })))
  })

  it('shows the resolved payment icon in the selection sheet', async () => {
    registerHandlers()
    renderNewTransaction()

    fireEvent.click(await screen.findByRole('button', { name: '支払い方法選択しない' }))

    await waitFor(() => expect(document.querySelector('img[src="/payment-icons/card_rakuten.svg"]')).not.toBeNull())
  })

  it('keeps entered values when saving fails', async () => {
    registerHandlers({ createStatus: 422 })
    renderNewTransaction()

    await screen.findByRole('button', { name: 'ランチを候補から適用' })
    fireEvent.click(screen.getByRole('button', { name: 'ランチを候補から適用' }))
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1200' } })
    fireEvent.change(screen.getByLabelText('取引名'), { target: { value: 'ランチ' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(screen.getByLabelText('取引名')).toHaveValue('ランチ'))
    expect(screen.getByLabelText('金額')).toHaveValue('1200')
  })
})
