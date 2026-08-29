import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithGoogle = vi.hoisted(() => vi.fn())

vi.mock('../auth-context', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    user: null,
    error: null,
    signInWithGoogle,
    signOut: vi.fn(),
  }),
}))

import { LoginPanel } from './login-panel'

describe('LoginPanel', () => {
  beforeEach(() => {
    signInWithGoogle.mockReset()
    signInWithGoogle.mockResolvedValue(undefined)
  })

  it('offers Google sign-in without email or password controls', () => {
    render(<LoginPanel />)

    expect(screen.getByRole('button', { name: 'Googleで続行' })).toBeVisible()
    expect(screen.queryByLabelText('メールアドレス')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('パスワード')).not.toBeInTheDocument()
    expect(screen.queryByText('新規登録')).not.toBeInTheDocument()
  })

  it('starts Google popup authentication', () => {
    render(<LoginPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Googleで続行' }))

    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })
})
