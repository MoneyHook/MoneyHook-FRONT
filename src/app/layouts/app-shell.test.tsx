import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/shared/components/ui/tooltip'

const authState = vi.hoisted(() => ({
  user: {
    displayName: 'MoneyHooksユーザー',
    email: 'user@example.com',
    photoURL: null,
  },
  signOut: vi.fn(),
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => authState,
}))

import { AppShell } from './app-shell'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
}

function renderAppShell(initialEntry = '/app/home') {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/app/home" element={<p>ホームの本文</p>} />
            <Route path="/app/settings" element={<p>設定の本文</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

function getFloatingSidebarTrigger() {
  const trigger = document.querySelector<HTMLButtonElement>(
    '[data-slot="sidebar-trigger"]',
  )

  if (!trigger) {
    throw new Error('Floating sidebar trigger was not rendered')
  }

  return trigger
}

describe('AppShell', () => {
  beforeEach(() => {
    setViewportWidth(1024)
  })

  it('renders floating controls without the shared app header', () => {
    renderAppShell()

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(getFloatingSidebarTrigger()).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'アカウントメニューを開く' }),
    ).toBeInTheDocument()
  })

  it('toggles the desktop sidebar from the floating trigger', async () => {
    const user = userEvent.setup()
    renderAppShell()

    const trigger = getFloatingSidebarTrigger()
    const sidebar = document.querySelector('[data-slot="sidebar"]')

    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    expect(trigger).toHaveClass(
      'md:left-[calc(var(--sidebar-width)+0.75rem)]',
    )

    await user.click(trigger)

    expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    expect(trigger).toHaveClass(
      'md:left-[calc(var(--sidebar-width-icon)+0.75rem)]',
    )
  })

  it('keeps the user menu and bottom navigation on mobile', () => {
    setViewportWidth(768)
    renderAppShell()

    expect(
      screen.getByRole('button', { name: 'アカウントメニューを開く' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'メインナビゲーション' }),
    ).toBeInTheDocument()
    expect(getFloatingSidebarTrigger()).toHaveClass('hidden')
  })
})
