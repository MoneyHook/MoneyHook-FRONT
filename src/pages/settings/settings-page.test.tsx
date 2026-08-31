import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccentProvider } from '@/shared/hooks/accent-provider'
import { server } from '@/test/msw/server'

const authState = vi.hoisted(() => ({
  user: {
    displayName: 'MoneyHooksユーザー',
    email: 'user@example.com',
    photoURL: null,
  },
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

import { SettingsPage } from './settings-page'

type BudgetRequest = {
  monthly_budget_amount: number
  effective_from: string
}

type PaymentRequest = {
  payment_name: string
  payment_type_id: string
  payment_date?: number
  closing_date?: number
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

function renderSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AccentProvider>
        <SettingsPage />
      </AccentProvider>
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
    registerPaymentHandlers()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows the signed-in account and supports logging out', () => {
    renderSettingsPage()

    expect(screen.getByRole('heading', { name: 'アカウント' })).toBeInTheDocument()
    expect(screen.getByText('MoneyHooksユーザー')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    expect(authState.signOut).toHaveBeenCalledOnce()
  })

  it('exposes each settings card as a labelled region', () => {
    renderSettingsPage()

    expect(screen.getByRole('region', { name: 'アカウント' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '予算' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '支払い方法' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '表示' })).toBeInTheDocument()
  })

  it('shows an error toast when logging out fails', async () => {
    authState.signOut.mockRejectedValueOnce(new Error('sign out failed'))

    renderSettingsPage()

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'ログアウトできませんでした。もう一度お試しください。',
      )
    })
  })

  it('provides the display theme menu on the settings page', () => {
    renderSettingsPage()

    expect(
      screen.getByRole('button', { name: '表示テーマを変更' }),
    ).toBeInTheDocument()
  })

  it('lets the user select each available accent color', async () => {
    renderSettingsPage()

    const accentLabels = ['ブルー', 'グリーン', 'バイオレット', 'ローズ', 'ブラック']
    for (const label of accentLabels) {
      expect(screen.getByRole('radio', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('radio', { name: /^ブルー/ }))

    await waitFor(() => {
      expect(localStorage.getItem('moneyhooks-accent')).toBe('blue')
      expect(document.documentElement.dataset.accent).toBe('blue')
    })
  })

  it('loads the existing monthly budget into the form', async () => {
    renderSettingsPage()

    expect(await screen.findByRole('spinbutton', { name: '月額予算' })).toHaveValue(300_000)
  })

  it('leaves the amount empty when no budget is configured', async () => {
    registerBudgetHandlers({ initialAmount: null })
    renderSettingsPage()

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    await waitFor(() => expect(screen.getByText('今月1日から適用されます。')).toBeVisible())
    expect(input).toHaveValue(null)
  })

  it('saves the budget from the current month and updates the form', async () => {
    const requests = registerBudgetHandlers()
    renderSettingsPage()

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
    renderSettingsPage()

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    fireEvent.change(input, { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: '予算を保存' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(requests).toHaveLength(0)
  })

  it('shows an inline error when loading the budget fails', async () => {
    registerBudgetHandlers({ getError: true })
    renderSettingsPage()

    expect(await screen.findByText('予算設定を読み込めません')).toBeVisible()
    expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeEnabled()
  })

  it('shows the API error when saving the budget fails', async () => {
    registerBudgetHandlers({ initialAmount: null, saveError: true })
    renderSettingsPage()

    const input = await screen.findByRole('spinbutton', { name: '月額予算' })
    fireEvent.change(input, { target: { value: '100000' } })
    fireEvent.click(screen.getByRole('button', { name: '予算を保存' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('予算保存に失敗しました')
    })
  })

  it('lists existing payment methods including card billing days', async () => {
    renderSettingsPage()

    expect(await screen.findByText('楽天カード')).toBeVisible()
    expect(screen.getByText('カード ・ 締め日 31日 / 支払日 27日')).toBeVisible()
    expect(document.querySelector('img[src="/payment-icons/card_rakuten.svg"]')).not.toBeNull()
    expect(screen.getAllByText('現金')).toHaveLength(2)
  })

  it('adds a cash payment method without billing days', async () => {
    const { addRequests } = registerPaymentHandlers({ initialPayments: [] })
    renderSettingsPage()

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
    renderSettingsPage()

    await screen.findByText('支払い方法がありません')
    fireEvent.click(screen.getByRole('button', { name: '支払い方法を追加' }))
    fireEvent.change(screen.getByRole('textbox', { name: '支払い方法名' }), { target: { value: '新しいカード' } })
    fireEvent.click(screen.getByRole('combobox', { name: '支払いの種類' }))
    fireEvent.click(await screen.findByRole('option', { name: 'カード' }))
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
    renderSettingsPage()

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
    expect(window.confirm).toHaveBeenCalledWith('「メインカード」を削除しますか？')
    await waitFor(() => expect(screen.queryByText('メインカード')).not.toBeInTheDocument())
  })

  it('shows an inline error and retry action when payment methods cannot load', async () => {
    registerPaymentHandlers({ getError: true })
    renderSettingsPage()

    expect(await screen.findByText('支払い方法を読み込めません')).toBeVisible()
    expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeEnabled()
  })

  it('keeps the payment method and shows the API error when deletion is rejected', async () => {
    registerPaymentHandlers({ deleteError: true })
    renderSettingsPage()

    await screen.findByText('楽天カード')
    fireEvent.click(screen.getByRole('button', { name: '楽天カードを削除' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('関連する取引があるため削除できません')
    })
    expect(screen.getByText('楽天カード')).toBeVisible()
  })
})
