import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

const frequentTransaction = {
  transaction_name: 'ランチ',
  category_id: '10',
  sub_category_id: '11',
  fixed_flg: false,
  payment_id: '30',
  category_name: '食費',
  sub_category_name: '外食',
}

function registerHandlers({
  createStatus = 201,
  frequentPending = false,
  frequentStatus = 200,
  frequentTransactions = [frequentTransaction],
} = {}) {
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
    http.get('http://api.test/api/transaction/getFrequentTransactionName', async () => {
      if (frequentPending) {
        await new Promise<void>(() => undefined)
      }

      return frequentStatus === 200
        ? HttpResponse.json({ transaction_list: frequentTransactions })
        : HttpResponse.json({ message: '候補を取得できませんでした' }, { status: frequentStatus })
    }),
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

    await screen.findByText('よく使う項目')
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('金額は1〜9,999,999円の整数で入力してください。')).toBeVisible()
    expect(screen.getByText('取引名は1〜32文字で入力してください。')).toBeVisible()
    expect(screen.getByText('カテゴリを選択してください。')).toBeVisible()
  })

  it('applies a transaction candidate and saves the API-compatible payload', async () => {
    let submittedBody: unknown
    const candidateTransactions = Array.from({ length: 7 }, (_, index) => (
      index === 6
        ? frequentTransaction
        : { ...frequentTransaction, transaction_name: `候補${index + 1}` }
    ))
    registerHandlers({ frequentTransactions: candidateTransactions })
    server.use(
      http.post('http://api.test/api/v1/transactions', async ({ request }) => {
        submittedBody = await request.json()
        return HttpResponse.json({ transaction: {} }, { status: 201 })
      }),
    )
    renderNewTransaction()

    fireEvent.click(await screen.findByRole('button', { name: '取引候補をもっと表示' }))
    const candidateSheet = await screen.findByRole('dialog')
    fireEvent.click(within(candidateSheet).getByRole('button', { name: 'ランチを候補から適用' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1200' } })
    fireEvent.click(screen.getByRole('tab', { name: '収入' }))
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

  it('opens all transaction candidates in a bottom sheet', async () => {
    const candidateTransactions = Array.from({ length: 13 }, (_, index) => ({
      ...frequentTransaction,
      transaction_name: `候補${index + 1}`,
    }))
    registerHandlers({ frequentTransactions: candidateTransactions })
    renderNewTransaction()

    const candidates = await screen.findByRole('region', { name: 'よく使う項目' })
    expect(candidates).toHaveClass('py-2', 'sm:py-5')
    const getCandidateButtons = () => within(candidates).getAllByRole('button', { name: /候補\d+を候補から適用/ })

    expect(getCandidateButtons()).toHaveLength(6)
    fireEvent.click(within(candidates).getByRole('button', { name: '取引候補をもっと表示' }))
    const candidateSheet = await screen.findByRole('dialog')

    expect(within(candidateSheet).getByRole('heading', { name: 'おすすめをすべて表示' })).toBeVisible()
    expect(candidateSheet).toHaveClass('overflow-hidden')
    expect(candidateSheet).not.toHaveClass('overflow-y-auto')
    expect(candidateSheet.querySelector('.overflow-y-auto')).toHaveClass('min-h-0', 'flex-1')
    expect(within(candidateSheet).getByText('すべての候補から選択できます')).toBeVisible()
    expect(within(candidateSheet).getAllByRole('button', { name: /候補\d+を候補から適用/ })).toHaveLength(13)

    fireEvent.click(within(candidateSheet).getByRole('button', { name: '候補13を候補から適用' }))
    await waitFor(() => expect(screen.getByLabelText('取引名')).toHaveValue('候補13'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not show the more button when there are six or fewer transaction candidates', async () => {
    const candidateTransactions = Array.from({ length: 6 }, (_, index) => ({
      ...frequentTransaction,
      transaction_name: `候補${index + 1}`,
    }))
    registerHandlers({ frequentTransactions: candidateTransactions })
    renderNewTransaction()

    const candidates = await screen.findByRole('region', { name: 'よく使う項目' })

    expect(within(candidates).getAllByRole('button', { name: /候補\d+を候補から適用/ })).toHaveLength(6)
    expect(within(candidates).queryByRole('button', { name: '取引候補をもっと表示' })).not.toBeInTheDocument()
  })

  it('shows only the category badge and transaction name in a candidate', async () => {
    registerHandlers({ frequentTransactions: [{ ...frequentTransaction, fixed_flg: true }] })
    renderNewTransaction()

    const candidates = await screen.findByRole('region', { name: 'よく使う項目' })
    const candidate = within(candidates).getByRole('button', { name: 'ランチを候補から適用' })

    expect(candidate).toHaveTextContent('ランチ')
    expect(candidate).not.toHaveTextContent('食費')
    expect(candidate).not.toHaveTextContent('外食')
    expect(candidate).not.toHaveTextContent('固定費')
    expect(candidate.querySelector('img')).toBeNull()
    expect(candidate.querySelector('svg')).not.toBeNull()
  })

  it('uses semantic colors for the selected transaction sign', async () => {
    registerHandlers()
    renderNewTransaction()

    const expenseTab = await screen.findByRole('tab', { name: '支出' })
    const incomeTab = screen.getByRole('tab', { name: '収入' })
    const transactionTypeTabs = screen.getByRole('tablist', { name: '取引区分' })
    const pageTitle = screen.getByRole('heading', { name: '取引を追加' })
    const saveButton = screen.getByRole('button', { name: '保存' })
    const candidateButton = screen.getByRole('button', { name: 'ランチを候補から適用' })
    const dateRow = screen.getByRole('button', { name: '日付' })
    const transactionNameRow = screen.getByLabelText('取引名').parentElement
    const transactionForm = document.getElementById('transaction-form')
    const formContent = transactionForm?.firstElementChild
    const saveAction = saveButton.parentElement

    expect(expenseTab).toHaveClass('bg-card', 'text-expense')
    expect(expenseTab).toHaveClass('min-h-10', 'px-3', 'text-sm', 'sm:min-h-12', 'sm:px-4', 'sm:text-base')
    expect(transactionTypeTabs).toHaveClass('mt-3', 'p-0.5', 'sm:mt-8', 'sm:p-1.5')
    expect(pageTitle).toHaveClass('text-lg', 'sm:text-2xl')
    fireEvent.click(incomeTab)
    expect(incomeTab).toHaveClass('bg-card', 'text-income')
    expect(saveButton).toHaveAttribute('data-variant', 'default')
    expect(saveButton).toHaveAttribute('data-size', 'lg')
    expect(saveButton).toHaveAttribute('form', 'transaction-form')
    expect(saveButton).toHaveClass('h-12', 'rounded-full', 'sm:h-9', 'sm:rounded-lg')
    expect(transactionForm).toHaveClass('mt-3', 'min-h-0', 'flex-1', 'overflow-y-auto', 'pb-24', 'sm:mt-8', 'sm:overflow-visible')
    expect(formContent).toHaveClass('space-y-4', 'sm:space-y-6')
    expect(saveAction).toHaveClass('fixed', 'right-4', 'bottom-[max(1rem,env(safe-area-inset-bottom))]', 'sm:static')
    expect(candidateButton).toHaveClass('rounded-full')
    expect(candidateButton.querySelector('[data-slot="badge"]')).toHaveClass('h-9', 'px-3', 'text-sm')
    expect(candidateButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(dateRow).toHaveClass('min-h-12', 'sm:min-h-16', 'w-full', 'border-b')
    expect(transactionNameRow).toHaveClass('min-h-14', 'sm:min-h-16')
    expect(dateRow).toContainHTML('<svg')
    const categoryButton = screen.getByRole('button', { name: /カテゴリ.*選択してください.*サブカテゴリを選択/ })
    expect(categoryButton).toHaveClass('min-h-20', 'sm:min-h-28')
    const paymentButton = screen.getByRole('button', { name: '支払い方法選択しない' })
    expect(paymentButton).toHaveClass('min-h-20', 'sm:min-h-28')

    fireEvent.click(dateRow)
    const datePicker = await screen.findByRole('dialog')
    expect(datePicker).toBeVisible()
    expect(datePicker).toHaveClass('overflow-hidden')
    const todayCell = datePicker.querySelector('[data-today="true"]')
    expect(todayCell).not.toBeNull()
    expect(todayCell).not.toHaveClass('bg-accent')
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
    expect(screen.queryByText('よく使う項目')).not.toBeInTheDocument()
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

  it('shows the add form while transaction candidates are still loading', async () => {
    registerHandlers({ frequentPending: true })
    renderNewTransaction()

    expect(await screen.findByLabelText('金額')).toBeVisible()
    expect(screen.queryByText('よく使う項目')).not.toBeInTheDocument()
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
