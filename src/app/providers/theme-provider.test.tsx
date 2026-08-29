import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useTheme } from 'next-themes'
import { beforeEach, describe, expect, it } from 'vitest'

import { AppThemeProvider, THEME_STORAGE_KEY } from './theme-provider'

function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <output aria-label="選択中のテーマ">{theme}</output>
      <button type="button" onClick={() => setTheme('dark')}>
        ダークへ変更
      </button>
    </div>
  )
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('uses the system setting initially and persists a user selection', async () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のテーマ')).toHaveTextContent('system')
    })
    fireEvent.click(screen.getByRole('button', { name: 'ダークへ変更' }))

    await waitFor(() => {
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })
    expect(document.documentElement).toHaveClass('dark')
  })
})
