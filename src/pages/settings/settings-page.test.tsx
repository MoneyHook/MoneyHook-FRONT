import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccentProvider } from '@/shared/hooks/accent-provider'

const authState = vi.hoisted(() => ({
  user: {
    displayName: 'MoneyHooksユーザー',
    email: 'user@example.com',
    photoURL: null,
  },
  signOut: vi.fn(),
}))

const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}))

import { SettingsPage } from './settings-page'

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.accent
    authState.signOut.mockReset()
    authState.signOut.mockResolvedValue(undefined)
    toastError.mockReset()
  })

  it('shows the signed-in account and supports logging out', () => {
    render(
      <AccentProvider>
        <SettingsPage />
      </AccentProvider>,
    )

    expect(screen.getByRole('heading', { name: 'アカウント' })).toBeInTheDocument()
    expect(screen.getByText('MoneyHooksユーザー')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    expect(authState.signOut).toHaveBeenCalledOnce()
  })

  it('shows an error toast when logging out fails', async () => {
    authState.signOut.mockRejectedValueOnce(new Error('sign out failed'))

    render(
      <AccentProvider>
        <SettingsPage />
      </AccentProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'ログアウトできませんでした。もう一度お試しください。',
      )
    })
  })

  it('provides the display theme menu on the settings page', () => {
    render(
      <AccentProvider>
        <SettingsPage />
      </AccentProvider>,
    )

    expect(
      screen.getByRole('button', { name: '表示テーマを変更' }),
    ).toBeInTheDocument()
  })

  it('lets the user select each available accent color', async () => {
    render(
      <AccentProvider>
        <SettingsPage />
      </AccentProvider>,
    )

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
})
