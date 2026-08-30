import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccentProvider } from './accent-provider'
import { ACCENT_STORAGE_KEY, useAccent } from './accent-context'

function AccentProbe() {
  const { accent, setAccent } = useAccent()

  return (
    <div>
      <output aria-label="選択中のアクセントカラー">{accent}</output>
      <button type="button" onClick={() => setAccent('black')}>
        ブラックへ変更
      </button>
    </div>
  )
}

describe('AccentProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.accent
  })

  it('uses blue initially and persists a user selection', async () => {
    render(
      <AccentProvider>
        <AccentProbe />
      </AccentProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のアクセントカラー')).toHaveTextContent(
        'blue',
      )
      expect(document.documentElement.dataset.accent).toBe('blue')
    })

    fireEvent.click(screen.getByRole('button', { name: 'ブラックへ変更' }))

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のアクセントカラー')).toHaveTextContent(
        'black',
      )
      expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('black')
      expect(document.documentElement.dataset.accent).toBe('black')
    })
  })

  it('falls back to blue for an invalid stored value', async () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, 'invalid')

    render(
      <AccentProvider>
        <AccentProbe />
      </AccentProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のアクセントカラー')).toHaveTextContent(
        'blue',
      )
      expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('blue')
      expect(document.documentElement.dataset.accent).toBe('blue')
    })
  })
})
