import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/test/msw/server'

const authState = vi.hoisted(() => ({
  status: 'authenticated',
  user: { uid: 'user-1' },
}))
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth', () => ({ useAuth: () => authState }))
vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: vi.fn(async () => 'test-token') },
  }),
}))
vi.mock('sonner', () => ({ toast: { error: toastError } }))

import { useAppearance } from './appearance-context'
import { AppearanceProvider } from './appearance-provider'

function AppearanceProbe() {
  const { accent, chartPalette, setChartPalette, setTheme, theme } = useAppearance()
  return (
    <div>
      <output aria-label="theme">{theme}</output>
      <output aria-label="accent">{accent}</output>
      <output aria-label="palette">{chartPalette}</output>
      <button onClick={() => setChartPalette('colorful')} type="button">palette</button>
      <button onClick={() => setTheme('dark')} type="button">theme</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AppearanceProvider>
        <AppearanceProbe />
      </AppearanceProvider>
    </QueryClientProvider>,
  )
}

describe('AppearanceProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.accent
    delete document.documentElement.dataset.chartPalette
    toastError.mockReset()
  })

  it('loads the authenticated user settings from the API and persists changes there', async () => {
    const requests: unknown[] = []
    server.use(
      http.get('http://api.test/api/v1/settings', () => HttpResponse.json({
        accent_color: 'violet', chart_palette: 'monochrome', theme_mode: 'dark',
      })),
      http.patch('http://api.test/api/v1/settings', async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json({
          accent_color: 'violet', chart_palette: 'colorful', theme_mode: 'dark',
        })
      }),
    )

    renderProvider()

    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('dark'))
    expect(screen.getByLabelText('accent')).toHaveTextContent('violet')
    expect(screen.getByLabelText('palette')).toHaveTextContent('monochrome')
    expect(document.documentElement).toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: 'palette' }))
    expect(screen.getByLabelText('palette')).toHaveTextContent('colorful')
    await waitFor(() => expect(requests).toEqual([{ chart_palette: 'colorful' }]))
    expect(localStorage.length).toBe(0)
  })

  it('restores the prior setting and reports an error when saving fails', async () => {
    server.use(
      http.get('http://api.test/api/v1/settings', () => HttpResponse.json({
        accent_color: 'blue', chart_palette: 'default', theme_mode: 'system',
      })),
      http.patch('http://api.test/api/v1/settings', () => HttpResponse.json(
        { code: 'INTERNAL_ERROR', message: 'failed' }, { status: 500 },
      )),
    )

    renderProvider()
    await screen.findByLabelText('theme')
    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('system'))

    fireEvent.click(screen.getByRole('button', { name: 'theme' }))
    expect(screen.getByLabelText('theme')).toHaveTextContent('dark')
    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('system'))
    expect(toastError).toHaveBeenCalledOnce()
  })
})
