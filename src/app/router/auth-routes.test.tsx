import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({ status: 'initializing' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))

import { ProtectedRoute } from './auth-routes'

function renderProtectedRoute(initialEntry = '/app/home') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app/home" element={<p>Protected content</p>} />
        </Route>
        <Route path="/login" element={<p>Login route</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.status = 'initializing'
  })

  it('keeps the loading state while authentication is unresolved', () => {
    renderProtectedRoute()
    expect(screen.getByText('認証状態を確認しています')).toBeInTheDocument()
    expect(screen.queryByText('Login route')).not.toBeInTheDocument()
  })

  it('renders the protected outlet after authentication', () => {
    authState.status = 'authenticated'
    renderProtectedRoute()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects an unauthenticated deep link to login', () => {
    authState.status = 'unauthenticated'
    renderProtectedRoute('/app/home?month=2026-08-01')
    expect(screen.getByText('Login route')).toBeInTheDocument()
  })
})
