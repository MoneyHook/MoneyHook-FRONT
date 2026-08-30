import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccentProvider } from '@/shared/hooks/accent-provider'

import { SettingsPage } from './settings-page'

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.accent
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
