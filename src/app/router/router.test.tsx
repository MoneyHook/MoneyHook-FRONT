import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ authenticated: false }))
const loadedPages = vi.hoisted(() => ({ home: false }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    status: auth.authenticated ? 'authenticated' : 'unauthenticated',
    user: null,
    signOut: vi.fn(),
  }),
}))
vi.mock('@/pages/login/login-page', () => ({
  LoginPage: () => <h1>Login test page</h1>,
}))
vi.mock('@/pages/home/home-page', () => {
  loadedPages.home = true
  return { HomePage: () => <h1>Home test page</h1> }
})
vi.mock('@/pages/settings/csv-import-page', () => ({
  CsvImportPage: () => <h1>Import test page</h1>,
}))

import { TooltipProvider } from '@/shared/components/ui/tooltip'

import { router } from './router'

function renderRoute(path: string) {
  const memoryRouter = createMemoryRouter(router.routes, {
    initialEntries: [path],
  })
  render(
    <Suspense fallback={<p role="status">Loading</p>}>
      <TooltipProvider>
        <RouterProvider router={memoryRouter} />
      </TooltipProvider>
    </Suspense>,
  )
  return memoryRouter
}

describe('lazy application routes', () => {
  it('redirects anonymous visitors without loading the protected page', async () => {
    auth.authenticated = false
    const memoryRouter = renderRoute('/app/home?month=2026-09')

    expect(await screen.findByText('Login test page')).toBeVisible()
    expect(loadedPages.home).toBe(false)
    expect(memoryRouter.state.location.search).toBe(
      '?redirect=%2Fapp%2Fhome%3Fmonth%3D2026-09',
    )
    memoryRouter.dispose()
  })

  it('loads a protected deep link and keeps the navigation visible', async () => {
    auth.authenticated = true
    const memoryRouter = renderRoute('/app/home')

    expect(await screen.findByText('Home test page')).toBeVisible()
    expect(
      screen.getByRole('navigation', { name: 'メインナビゲーション' }),
    ).toBeVisible()
    memoryRouter.dispose()
  })

  it('preserves the old import URL redirect to the lazy import page', async () => {
    auth.authenticated = true
    const memoryRouter = renderRoute('/app/settings/import')

    expect(await screen.findByText('Import test page')).toBeVisible()
    expect(memoryRouter.state.location.pathname).toBe(
      '/app/transactions/import',
    )
    memoryRouter.dispose()
  })
})
