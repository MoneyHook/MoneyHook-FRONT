import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { ChartPaletteProvider } from './chart-palette-provider'
import {
  CHART_PALETTE_STORAGE_KEY,
  useChartPalette,
} from './chart-palette-context'

function ChartPaletteProbe() {
  const { chartPalette, setChartPalette } = useChartPalette()

  return (
    <div>
      <output aria-label="選択中のグラフカラーセット">{chartPalette}</output>
      <button type="button" onClick={() => setChartPalette('monochrome')}>
        モノトーンへ変更
      </button>
    </div>
  )
}

describe('ChartPaletteProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.chartPalette
  })

  it('uses the default palette initially and persists a user selection', async () => {
    render(
      <ChartPaletteProvider>
        <ChartPaletteProbe />
      </ChartPaletteProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のグラフカラーセット')).toHaveTextContent(
        'default',
      )
      expect(document.documentElement.dataset.chartPalette).toBe('default')
    })

    fireEvent.click(screen.getByRole('button', { name: 'モノトーンへ変更' }))

    await waitFor(() => {
      expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('monochrome')
      expect(document.documentElement.dataset.chartPalette).toBe('monochrome')
    })
  })

  it('falls back to the default palette for an invalid stored value', async () => {
    localStorage.setItem(CHART_PALETTE_STORAGE_KEY, 'invalid')

    render(
      <ChartPaletteProvider>
        <ChartPaletteProbe />
      </ChartPaletteProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のグラフカラーセット')).toHaveTextContent(
        'default',
      )
      expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBe('default')
    })
  })

  it('applies a palette changed in another tab', async () => {
    render(
      <ChartPaletteProvider>
        <ChartPaletteProbe />
      </ChartPaletteProvider>,
    )

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: CHART_PALETTE_STORAGE_KEY,
        newValue: 'colorful',
      }),
    )

    await waitFor(() => {
      expect(screen.getByLabelText('選択中のグラフカラーセット')).toHaveTextContent(
        'colorful',
      )
      expect(document.documentElement.dataset.chartPalette).toBe('colorful')
    })
  })
})
