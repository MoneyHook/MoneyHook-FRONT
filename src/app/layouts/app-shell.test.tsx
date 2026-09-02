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
            <Route path="/app/transactions" element={<p>取引の本文</p>} />
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
    authState.signOut.mockReset()
    authState.signOut.mockResolvedValue(undefined)
  })

  it('renders the sidebar account menu without the shared app header', () => {
    renderAppShell()

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(getFloatingSidebarTrigger()).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-inset"]')).toHaveClass(
      'min-w-0',
    )
    const accountMenuButton = screen.getByRole('button', {
      name: 'アカウントメニューを開く',
    })
    expect(accountMenuButton).toHaveTextContent('MoneyHooksユーザー')
    expect(accountMenuButton.closest('[data-slot="sidebar-footer"]')).not.toBeNull()
  })

  it('uses a muted active state without a check icon in the sidebar', () => {
    renderAppShell()

    const homeLink = document.querySelector<HTMLAnchorElement>(
      '[data-slot="sidebar-menu-button"][href="/app/home"]',
    )

    if (!homeLink) {
      throw new Error('Home link was not rendered in the sidebar')
    }

    expect(homeLink).toHaveClass(
      'hover:bg-muted',
      'hover:text-foreground',
      'active:bg-muted',
      'active:text-foreground',
      'data-active:bg-muted',
      'data-active:text-foreground',
    )
    expect(homeLink.querySelectorAll('svg')).toHaveLength(1)
  })

  it('opens the sidebar account menu and signs out from its action', async () => {
    const user = userEvent.setup()
    renderAppShell()

    await user.click(
      screen.getByRole('button', { name: 'アカウントメニューを開く' }),
    )

    expect(screen.getByText('user@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'ログアウト' }))

    expect(authState.signOut).toHaveBeenCalledOnce()
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

  it('removes the floating account menu and keeps bottom navigation on mobile', () => {
    setViewportWidth(768)
    renderAppShell()

    expect(
      screen.queryByRole('button', { name: 'アカウントメニューを開く' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'メインナビゲーション' }),
    ).toBeInTheDocument()
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'メインナビゲーション',
    })
    expect(mobileNavigation.querySelectorAll('a')).toHaveLength(5)
    expect(
      screen.getByRole('link', { name: '新しい取引を追加' }),
    ).toHaveAttribute('href', '/app/transactions/new')
    expect(
      screen.getByRole('link', { name: '新しい取引を追加' }).querySelector('svg'),
    ).toBeInTheDocument()
    expect(getFloatingSidebarTrigger()).toHaveClass('hidden')
  })
})
