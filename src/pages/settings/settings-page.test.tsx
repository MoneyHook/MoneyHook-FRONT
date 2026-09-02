import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppearanceProvider } from '@/shared/hooks/appearance-provider'
import { server } from '@/test/msw/server'

const authState = vi.hoisted(() => ({
  user: {
    displayName: 'MoneyHooksユーザー',
    email: 'user@example.com',
    photoURL: null,
    uid: 'user-1',
  },
  status: 'authenticated',
  signOut: vi.fn(),
}))

const toastError = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))

vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: vi.fn(async () => 'test-token') },
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

import {
  AccountSettingsPage,
  AppearanceSettingsPage,
  BudgetSettingsPage,
  PaymentSettingsPage,
  RecurringTransactionSettingsPage,
  SettingsPage,
} from './settings-page'

type BudgetRequest = {
  monthly_budget_amount: number
  effective_from: string
}

function registerAppearanceSettingsHandlers() {
  let settings = {
    accent_color: 'blue',
    chart_palette: 'default',
    theme_mode: 'system',
  }

  server.use(
    http.get('http://api.test/api/v1/settings', () => HttpResponse.json(settings)),
    http.patch('http://api.test/api/v1/settings', async ({ request }) => {
      const patch = (await request.json()) as Partial<typeof settings>
      settings = { ...settings, ...patch }
      return HttpResponse.json(settings)
    }),
  )
}

type PaymentRequest = {
  payment_name: string
  payment_type_id: string
  payment_date?: number
  closing_date?: number
}

type RecurringRule = {
  category_id: string
  category_name: string
  monthly_transaction_amount: number
  monthly_transaction_date: number
  monthly_transaction_id: string
  monthly_transaction_name: string
  monthly_transaction_sign: -1 | 1
  payment_id: string | null
  sub_category_id: string
  sub_category_name: string
}

type RecurringRequest = {
  monthly_transaction: {
    category_id: string
    include_flg?: boolean
    monthly_transaction_amount: number
    monthly_transaction_date: number
    monthly_transaction_id?: string
    monthly_transaction_name: string
    monthly_transaction_sign: -1 | 1
    payment_id?: string
    sub_category_id: string
  }
}

function registerBudgetHandlers({
  getError = false,
  initialAmount = 300_000,
  saveError = false,
}: {
  getError?: boolean
  initialAmount?: number | null
  saveError?: boolean
} = {}) {
  let currentAmount = initialAmount
  const requests: BudgetRequest[] = []

  server.use(
    http.get('http://api.test/api/v1/budget', () => {
      if (getError) {
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '予算設定の取得に失敗しました' },
          { status: 500 },
        )
      }

      return HttpResponse.json({
        monthly_budget_amount: currentAmount,
        effective_from: currentAmount === null ? null : '2026-08-01',
      })
    }),
    http.put('http://api.test/api/v1/budget', async ({ request }) => {
      const body = (await request.json()) as BudgetRequest
      requests.push(body)
      if (saveError) {
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '予算保存に失敗しました' },
          { status: 500 },
        )
      }

      currentAmount = body.monthly_budget_amount
      return HttpResponse.json({
        monthly_budget_amount: currentAmount,
        effective_from: body.effective_from,
      })
    }),
  )

  return requests
}

function registerPaymentHandlers({
  deleteError = false,
  getError = false,
  initialPayments = [
    {
      closing_date: 31,
      payment_date: 27,
      payment_id: '20',
      payment_name: '楽天カード',
      payment_type_id: '2',
    },
    {
      closing_date: 31,
      payment_date: null,
      payment_id: '21',
      payment_name: '現金',
      payment_type_id: '1',
    },
  ],
}: {
  deleteError?: boolean
  getError?: boolean
  initialPayments?: Array<{
    closing_date: number
    payment_date: number | null
    payment_id: string
    payment_name: string
    payment_type_id: string
  }>
} = {}) {
  let payments = [...initialPayments]
  const addRequests: PaymentRequest[] = []
  const editRequests: Array<PaymentRequest & { payment_id: string }> = []

  server.use(
    http.get('http://api.test/api/payment/getPayment', () => {
      if (getError) {
        return HttpResponse.json({ message: '支払い方法の取得に失敗しました' }, { status: 500 })
      }
      return HttpResponse.json({ payment_list: payments })
    }),
    http.get('http://api.test/api/payment/getPaymentType', () =>
      HttpResponse.json({
        payment_type_list: [
          { is_payment_due_later: false, payment_type_id: '1', payment_type_name: '現金' },
          { is_payment_due_later: true, payment_type_id: '2', payment_type_name: 'カード' },
          { is_payment_due_later: false, payment_type_id: '3', payment_type_name: 'QRペイ' },
        ],
      }),
    ),
    http.post('http://api.test/api/payment/addPayment', async ({ request }) => {
      const body = (await request.json()) as PaymentRequest
      addRequests.push(body)
      payments = [...payments, {
        closing_date: body.closing_date ?? 31,
        payment_date: body.payment_date ?? null,
        payment_id: String(payments.length + 22),
        payment_name: body.payment_name,
        payment_type_id: body.payment_type_id,
      }]
      return HttpResponse.json({ success: true })
    }),
    http.patch('http://api.test/api/payment/editPayment', async ({ request }) => {
      const body = (await request.json()) as PaymentRequest & { payment_id: string }
      editRequests.push(body)
      payments = payments.map((payment) => payment.payment_id === body.payment_id ? {
        closing_date: body.closing_date ?? 31,
        payment_date: body.payment_date ?? null,
        payment_id: payment.payment_id,
        payment_name: body.payment_name,
        payment_type_id: body.payment_type_id,
      } : payment)
      return HttpResponse.json({ success: true })
    }),
    http.delete('http://api.test/api/payment/deletePayment/:paymentId', ({ params }) => {
      if (deleteError) {
        return HttpResponse.json('関連する取引があるため削除できません', { status: 422 })
      }
      payments = payments.filter((payment) => payment.payment_id !== params.paymentId)
      return HttpResponse.json({ success: true })
    }),
  )

  return { addRequests, editRequests }
}

function registerRecurringTransactionHandlers({
  deleteError = false,
  getError = false,
  initialActive = [
    {
      category_id: '22',
      category_name: '住居',
      monthly_transaction_amount: 78_550,
      monthly_transaction_date: 27,
      monthly_transaction_id: '100',
      monthly_transaction_name: '家賃',
      monthly_transaction_sign: -1 as const,
      payment_id: '20',
      sub_category_id: '220',
      sub_category_name: '家賃',
    },
  ],
  initialPaused = [
    {
      category_id: '15',
      category_name: '健康',
      monthly_transaction_amount: 5_000,
      monthly_transaction_date: 10,
      monthly_transaction_id: '101',
      monthly_transaction_name: 'ジム',
      monthly_transaction_sign: -1 as const,
      payment_id: '21',
      sub_category_id: '150',
      sub_category_name: 'ジム・フィットネス',
    },
  ],
}: {
  deleteError?: boolean
  getError?: boolean
  initialActive?: RecurringRule[]
  initialPaused?: RecurringRule[]
} = {}) {
  let active = [...initialActive]
  let paused = [...initialPaused]
  const addRequests: RecurringRequest[] = []
  const editRequests: RecurringRequest[] = []

  const categories = [
    {
      category_id: '22',
      category_name: '住居',
      sub_category_list: [{ enable: true, sub_category_id: '220', sub_category_name: '家賃' }],
    },
    {
      category_id: '15',
      category_name: '健康',
      sub_category_list: [{ enable: true, sub_category_id: '150', sub_category_name: 'ジム・フィットネス' }],
    },
  ]

  server.use(
    http.get('http://api.test/api/fixed/getFixed', () => {
      if (getError) return HttpResponse.json({ message: '自動入力を取得できません' }, { status: 500 })
      return HttpResponse.json({ monthly_transaction_list: active })
    }),
    http.get('http://api.test/api/fixed/getDeletedFixed', () => {
      if (getError) return HttpResponse.json({ message: '自動入力を取得できません' }, { status: 500 })
      return HttpResponse.json(paused)
    }),
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({ category_list: categories }),
    ),
    http.post('http://api.test/api/fixed/addFixed', async ({ request }) => {
      const body = (await request.json()) as RecurringRequest
      addRequests.push(body)
      const rule = body.monthly_transaction
      const category = categories.find((item) => item.category_id === rule.category_id)
      const subcategory = category?.sub_category_list.find((item) => item.sub_category_id === rule.sub_category_id)
      active = [...active, {
        ...rule,
        category_name: category?.category_name ?? '未分類',
        monthly_transaction_id: '102',
        payment_id: rule.payment_id || null,
        sub_category_name: subcategory?.sub_category_name ?? '未分類',
      }]
      return HttpResponse.json({ success: true })
    }),
    http.patch('http://api.test/api/fixed/editFixed', async ({ request }) => {
      const body = (await request.json()) as RecurringRequest
      editRequests.push(body)
      const rule = body.monthly_transaction
      const previous = [...active, ...paused].find((item) => item.monthly_transaction_id === rule.monthly_transaction_id)
      const category = categories.find((item) => item.category_id === rule.category_id)
      const subcategory = category?.sub_category_list.find((item) => item.sub_category_id === rule.sub_category_id)
      const updated: RecurringRule = {
        ...rule,
        category_name: category?.category_name ?? previous?.category_name ?? '未分類',
        monthly_transaction_id: rule.monthly_transaction_id ?? '',
        payment_id: rule.payment_id || null,
        sub_category_name: subcategory?.sub_category_name ?? previous?.sub_category_name ?? '未分類',
      }
      active = active.filter((item) => item.monthly_transaction_id !== updated.monthly_transaction_id)
      paused = paused.filter((item) => item.monthly_transaction_id !== updated.monthly_transaction_id)
      if (rule.include_flg) active = [...active, updated]
      else paused = [...paused, updated]
      return HttpResponse.json({ success: true })
    }),
    http.delete('http://api.test/api/fixed/deleteFixed/:id', ({ params }) => {
      if (deleteError) return HttpResponse.json({ message: '自動入力を削除できません' }, { status: 422 })
      active = active.filter((item) => item.monthly_transaction_id !== params.id)
      paused = paused.filter((item) => item.monthly_transaction_id !== params.id)
      return HttpResponse.json({ success: true })
    }),
  )

  return { addRequests, editRequests }
}

type SettingsTestPage =
  | 'account'
  | 'appearance'
  | 'budget'
  | 'payments'
  | 'recurring'
  | 'summary'

function renderSettingsPage(page: SettingsTestPage = 'summary') {
  const Page = {
    account: AccountSettingsPage,
    appearance: AppearanceSettingsPage,
    budget: BudgetSettingsPage,
    payments: PaymentSettingsPage,
    recurring: RecurringTransactionSettingsPage,
    summary: SettingsPage,
  }[page]
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppearanceProvider>
            <Page />
        </AppearanceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 22, 12))
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.accent
    authState.signOut.mockReset()
    authState.signOut.mockResolvedValue(undefined)
    toastError.mockReset()
    toastSuccess.mockReset()
    registerBudgetHandlers()
    registerAppearanceSettingsHandlers()
    registerPaymentHandlers()
    registerRecurringTransactionHandlers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the signed-in account and supports logging out', () => {
    renderSettingsPage('account')

    expect(screen.getByRole('heading', { name: 'アカウント' })).toBeInTheDocument()
    expect(screen.getByText('MoneyHooksユーザー')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    expect(authState.signOut).toHaveBeenCalledOnce()
  })

  it('shows compact settings summary cards that link to each detail page', () => {
    renderSettingsPage()

    expect(screen.getByRole('link', { name: 'アカウントの設定を開く' })).toHaveAttribute('href', '/app/settings/account')
    expect(screen.getByRole('link', { name: '予算の設定を開く' })).toHaveAttribute('href', '/app/settings/budget')
    expect(screen.getByRole('link', { name: '支払い方法の設定を開く' })).toHaveAttribute('href', '/app/settings/payments')
    expect(screen.getByRole('link', { name: '収支の自動入力の設定を開く' })).toHaveAttribute('href', '/app/settings/recurring-transactions')
    expect(screen.getByRole('link', { name: '表示の設定を開く' })).toHaveAttribute('href', '/app/settings/appearance')
    expect(screen.queryByRole('button', { name: '管理する' })).not.toBeInTheDocument()
  })

  it('uses neutral styling for settings actions and selected options', async () => {
    renderSettingsPage('appearance')

    const selectedAccent = screen.getByRole('radio', { name: /^ブルー/ })
    expect(selectedAccent.nextElementSibling).toHaveClass('peer-checked:border-foreground')
  })

  it('shows an error toast when logging out fails', async () => {
    authState.signOut.mockRejectedValueOnce(new Error('sign out failed'))

    renderSettingsPage('account')

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'ログアウトできませんでした。もう一度お試しください。',
      )
    })
  })

  it('provides the display theme cards on the settings page', () => {
    renderSettingsPage('appearance')

    for (const label of ['ライト', 'ダーク', 'システム']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument()
    }
  })

  it('lets the user select each available accent color', async () => {
    renderSettingsPage('appearance')

    const accentLabels = ['ブルー', 'グリーン', 'バイオレット', 'ローズ', 'ブラック']
    for (const label of accentLabels) {
      expect(screen.getByRole('radio', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('radio', { name: /^ブルー/ }))

    await waitFor(() => {
      expect(document.documentElement.dataset.accent).toBe('blue')
    })
  })

  it('lets the user select a chart color set', async () => {
    renderSettingsPage('appearance')

    for (const label of ['標準', 'カラフル', 'モノトーン']) {
      expect(screen.getByRole('radio', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('radio', { name: /^カラフル/ }))

    await waitFor(() => {
      expect(document.documentElement.dataset.chartPalette).toBe('colorful')
    })
  })

  it('loads the existing monthly budget into the form', async () => {
    renderSettingsPage('budget')

    expect(await screen.findByRole('spinbutton', { name: '月額予算' })).toHaveValue(300_000)
  })

  it('leaves the amount empty when no budget is configured', async () => {
    registerBudgetHandlers({ initialAmount: null })
    renderSettingsPage('budget')

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    await waitFor(() => expect(screen.getByText('今月1日から適用されます。')).toBeVisible())
    expect(input).toHaveValue(null)
  })

  it('saves the budget from the current month and updates the form', async () => {
    const requests = registerBudgetHandlers()
    renderSettingsPage('budget')

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    fireEvent.change(input, { target: { value: '350000' } })
    fireEvent.click(screen.getByRole('button', { name: '予算を保存' }))

    await waitFor(() => {
      expect(requests).toEqual([
        { effective_from: '2026-08-01', monthly_budget_amount: 350000 },
      ])
    })
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('予算を保存しました。')
      expect(input).toHaveValue(350_000)
    })
  })

  it.each([
    ['', '月額予算を入力してください。'],
    ['0', '1円以上の整数を入力してください。'],
    ['100.5', '1円以上の整数を入力してください。'],
  ])('rejects an invalid budget amount: %s', async (value, message) => {
    const requests = registerBudgetHandlers({ initialAmount: null })
    renderSettingsPage('budget')

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    fireEvent.change(input, { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: '予算を保存' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(requests).toHaveLength(0)
  })

  it('shows an inline error when loading the budget fails', async () => {
    registerBudgetHandlers({ getError: true })
    renderSettingsPage('budget')

    expect(await screen.findByText('予算設定を読み込めません')).toBeVisible()
    expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeEnabled()
  })

  it('shows the API error when saving the budget fails', async () => {
    registerBudgetHandlers({ initialAmount: null, saveError: true })
    renderSettingsPage('budget')

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    fireEvent.change(input, { target: { value: '100000' } })
    fireEvent.click(screen.getByRole('button', { name: '予算を保存' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('予算保存に失敗しました')
    })
  })

  it('lists existing payment methods including card billing days', async () => {
    renderSettingsPage('payments')

    expect(await screen.findByText('楽天カード')).toBeVisible()
    expect(screen.getByText('カード ・ 締め日 31日 / 支払日 27日')).toBeVisible()
    expect(document.querySelector('img[src="/payment-icons/card_rakuten.svg"]')).not.toBeNull()
    expect(screen.getAllByText('現金')).toHaveLength(2)
  })

  it('adds a cash payment method without billing days', async () => {
    const { addRequests } = registerPaymentHandlers({ initialPayments: [] })
    renderSettingsPage('payments')

    await screen.findByText('支払い方法がありません')
    fireEvent.click(screen.getByRole('button', { name: '支払い方法を追加' }))
    fireEvent.change(screen.getByRole('textbox', { name: '支払い方法名' }), { target: { value: '交通系IC' } })
    fireEvent.click(screen.getByRole('button', { name: '追加する' }))

    await waitFor(() => {
      expect(addRequests).toEqual([{ payment_name: '交通系IC', payment_type_id: '1' }])
      expect(toastSuccess).toHaveBeenCalledWith('支払い方法を追加しました。')
    })
  })

  it('requires billing days for cards and saves them after validation', async () => {
    const { addRequests } = registerPaymentHandlers({ initialPayments: [] })
    renderSettingsPage('payments')

    await screen.findByText('支払い方法がありません')
    fireEvent.click(screen.getByRole('button', { name: '支払い方法を追加' }))
    expect(screen.getByRole('dialog', { name: '支払い方法を追加' })).toBeVisible()
    fireEvent.change(screen.getByRole('textbox', { name: '支払い方法名' }), { target: { value: '新しいカード' } })
    fireEvent.click(screen.getByRole('radio', { name: 'カード' }))
    fireEvent.click(screen.getByRole('button', { name: '追加する' }))

    expect(await screen.findByText('締め日を入力してください。')).toBeVisible()
    expect(screen.getByText('支払日を入力してください。')).toBeVisible()
    expect(addRequests).toHaveLength(0)

    fireEvent.change(screen.getByRole('spinbutton', { name: '締め日' }), { target: { value: '31' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: '支払日' }), { target: { value: '27' } })
    fireEvent.click(screen.getByRole('button', { name: '追加する' }))

    await waitFor(() => {
      expect(addRequests).toEqual([{
        closing_date: 31,
        payment_date: 27,
        payment_name: '新しいカード',
        payment_type_id: '2',
      }])
    })
  })

  it('edits and deletes a payment method after confirmation', async () => {
    const { editRequests } = registerPaymentHandlers()
    renderSettingsPage('payments')

    await screen.findByText('楽天カード')
    fireEvent.click(screen.getByRole('button', { name: '楽天カードを編集' }))
    fireEvent.change(screen.getByRole('textbox', { name: '支払い方法名' }), { target: { value: 'メインカード' } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(editRequests).toEqual([{
        closing_date: 31,
        payment_date: 27,
        payment_id: '20',
        payment_name: 'メインカード',
        payment_type_id: '2',
      }])
    })
    expect(await screen.findByText('メインカード')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'メインカードを削除' }))
    expect(screen.getByRole('alertdialog')).toBeVisible()
    expect(screen.getByText('「メインカード」を削除します。この操作は取り消せません。')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))
    await waitFor(() => expect(screen.queryByText('メインカード')).not.toBeInTheDocument())
  })

  it('shows an inline error and retry action when payment methods cannot load', async () => {
    registerPaymentHandlers({ getError: true })
    renderSettingsPage('payments')

    expect(await screen.findByText('支払い方法を読み込めません')).toBeVisible()
    expect(within(screen.getByRole('region', { name: '支払い方法' })).getByRole('button', { name: 'もう一度試す' })).toBeEnabled()
  })

  it('keeps the payment method and shows the API error when deletion is rejected', async () => {
    registerPaymentHandlers({ deleteError: true })
    renderSettingsPage('payments')

    await screen.findByText('楽天カード')
    fireEvent.click(screen.getByRole('button', { name: '楽天カードを削除' }))
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('関連する取引があるため削除できません')
    })
    expect(screen.getByText('楽天カード')).toBeVisible()
  })

  it('lists active and paused recurring transactions', async () => {
    renderSettingsPage('recurring')

    expect(await screen.findByText('家賃')).toBeVisible()
    expect(screen.getByText(/毎月27日 ・ 住居 ・ 家賃 ・ 楽天カード/)).toBeVisible()
    expect(screen.getByText('停止中')).toBeVisible()
    expect(screen.getByText('ジム')).toBeVisible()
    expect(screen.getByRole('button', { name: '家賃を停止' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'ジムを再開' })).toBeEnabled()
  })

  it('creates a recurring transaction after validating and selecting its category', async () => {
    const { addRequests } = registerRecurringTransactionHandlers({ initialActive: [], initialPaused: [] })
    renderSettingsPage('recurring')

    await screen.findByText('有効な自動入力はありません。')
    fireEvent.click(screen.getByRole('button', { name: '自動入力を追加' }))
    expect(screen.getByRole('dialog', { name: '自動入力を追加' })).toBeVisible()
    fireEvent.change(screen.getByRole('textbox', { name: '取引名' }), { target: { value: '家賃' } })
    fireEvent.change(screen.getByRole('textbox', { name: '金額' }), { target: { value: '78550' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: '毎月の入力日' }), { target: { value: '27' } })
    fireEvent.click(screen.getByRole('combobox', { name: 'カテゴリ' }))
    fireEvent.click(await screen.findByRole('option', { name: '住居' }))
    fireEvent.click(screen.getByRole('combobox', { name: 'サブカテゴリ' }))
    fireEvent.click(await screen.findByRole('option', { name: '家賃' }))
    fireEvent.click(screen.getByRole('button', { name: '追加する' }))

    await waitFor(() => {
      expect(addRequests).toEqual([{
        monthly_transaction: {
          category_id: '22',
          monthly_transaction_amount: 78_550,
          monthly_transaction_date: 27,
          monthly_transaction_name: '家賃',
          monthly_transaction_sign: -1,
          payment_id: '',
          sub_category_id: '220',
        },
      }])
    })
  })

  it('stops, resumes, and permanently deletes recurring transactions', async () => {
    const { editRequests } = registerRecurringTransactionHandlers()
    renderSettingsPage('recurring')

    await screen.findByText('家賃')
    fireEvent.click(screen.getByRole('button', { name: '家賃を停止' }))
    await waitFor(() => expect(editRequests[0]?.monthly_transaction.include_flg).toBe(false))
    expect(await screen.findByRole('button', { name: '家賃を再開' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: '家賃を再開' }))
    await waitFor(() => expect(editRequests[1]?.monthly_transaction.include_flg).toBe(true))

    fireEvent.click(await screen.findByRole('button', { name: '家賃を完全に削除' }))
    expect(screen.getByRole('alertdialog')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '完全に削除する' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: '家賃を完全に削除' })).not.toBeInTheDocument())
  })

  it('edits a paused recurring transaction without resuming it', async () => {
    const { editRequests } = registerRecurringTransactionHandlers()
    renderSettingsPage('recurring')

    await screen.findByText('ジム')
    fireEvent.click(screen.getByRole('button', { name: 'ジムを編集' }))
    fireEvent.change(screen.getByRole('textbox', { name: '取引名' }), { target: { value: '新しいジム' } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(editRequests).toHaveLength(1)
      expect(editRequests[0]?.monthly_transaction).toMatchObject({
        include_flg: false,
        monthly_transaction_id: '101',
        monthly_transaction_name: '新しいジム',
      })
    })
    expect(await screen.findByRole('button', { name: '新しいジムを再開' })).toBeEnabled()
  })

  it('shows a retryable error when recurring transactions cannot load', async () => {
    registerRecurringTransactionHandlers({ getError: true })
    renderSettingsPage('recurring')

    expect(await screen.findByText('自動入力を読み込めません')).toBeVisible()
    expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeEnabled()
  })
})
