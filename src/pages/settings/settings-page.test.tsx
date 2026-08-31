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
  })

  afterEach(() => {
    vi.useRealTimers()
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
})
