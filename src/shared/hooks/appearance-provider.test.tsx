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

import {
  ACCENT_STORAGE_KEY,
  CHART_PALETTE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  useAppearance,
} from './appearance-context'
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

  it('uses local settings initially and replaces them with the API settings', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'green')
    localStorage.setItem(CHART_PALETTE_STORAGE_KEY, 'colorful')

    let resolveSettings: ((response: Response) => void) | undefined
    const settingsResponse = new Promise<Response>((resolve) => {
      resolveSettings = resolve
    })
    server.use(
      http.get('http://api.test/api/v1/settings', () => settingsResponse),
    )

    renderProvider()

    expect(screen.getByLabelText('theme')).toHaveTextContent('light')
    expect(screen.getByLabelText('accent')).toHaveTextContent('green')
    expect(screen.getByLabelText('palette')).toHaveTextContent('colorful')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.dataset.accent).toBe('green')
    expect(document.documentElement.dataset.chartPalette).toBe('colorful')

    resolveSettings?.(HttpResponse.json({
      accent_color: 'violet', chart_palette: 'monochrome', theme_mode: 'dark',
    }))

    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('dark'))
    expect(screen.getByLabelText('accent')).toHaveTextContent('violet')
    expect(screen.getByLabelText('palette')).toHaveTextContent('monochrome')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.accent).toBe('violet')
    expect(document.documentElement.dataset.chartPalette).toBe('monochrome')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('violet')
    expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('monochrome')
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
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('violet')
    expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('colorful')
  })

  it('keeps valid local settings when the API fetch fails', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'rose')
    localStorage.setItem(CHART_PALETTE_STORAGE_KEY, 'monochrome')
    server.use(
      http.get('http://api.test/api/v1/settings', () => HttpResponse.json(
        { code: 'INTERNAL_ERROR', message: 'failed' }, { status: 500 },
      )),
    )

    renderProvider()

    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('dark'))
    expect(screen.getByLabelText('accent')).toHaveTextContent('rose')
    expect(screen.getByLabelText('palette')).toHaveTextContent('monochrome')
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('rose')
    expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('monochrome')
  })

  it('falls back independently for invalid local settings', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'violet')
    localStorage.setItem(CHART_PALETTE_STORAGE_KEY, 'invalid')
    server.use(
      http.get('http://api.test/api/v1/settings', () => HttpResponse.json(
        { code: 'INTERNAL_ERROR', message: 'failed' }, { status: 500 },
      )),
    )

    renderProvider()

    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('system'))
    expect(screen.getByLabelText('accent')).toHaveTextContent('violet')
    expect(screen.getByLabelText('palette')).toHaveTextContent('default')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('violet')
    expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('default')
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
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    await waitFor(() => expect(screen.getByLabelText('theme')).toHaveTextContent('system'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(toastError).toHaveBeenCalledOnce()
  })
})
