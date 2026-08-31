import { useEffect, useState, type ReactNode } from 'react'

import {
  CHART_PALETTE_STORAGE_KEY,
  ChartPaletteContext,
  DEFAULT_CHART_PALETTE,
  isChartPalette,
  type ChartPalette,
} from './chart-palette-context'

function readStoredChartPalette(): ChartPalette {
  if (typeof window === 'undefined') {
    return DEFAULT_CHART_PALETTE
  }

  try {
    const storedChartPalette = window.localStorage.getItem(CHART_PALETTE_STORAGE_KEY)
    return isChartPalette(storedChartPalette) ? storedChartPalette : DEFAULT_CHART_PALETTE
  } catch {
    return DEFAULT_CHART_PALETTE
  }
}

export function ChartPaletteProvider({ children }: { children: ReactNode }) {
  const [chartPalette, setChartPalette] = useState<ChartPalette>(readStoredChartPalette)

  useEffect(() => {
    document.documentElement.dataset.chartPalette = chartPalette

    try {
      window.localStorage.setItem(CHART_PALETTE_STORAGE_KEY, chartPalette)
    } catch {
      // Ignore storage failures and keep the setting active for this session.
    }
  }, [chartPalette])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CHART_PALETTE_STORAGE_KEY) {
        return
      }

      setChartPalette(
        isChartPalette(event.newValue) ? event.newValue : DEFAULT_CHART_PALETTE,
      )
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <ChartPaletteContext.Provider value={{ chartPalette, setChartPalette }}>
      {children}
    </ChartPaletteContext.Provider>
  )
}
