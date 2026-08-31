import { createContext, useContext } from 'react'

export const CHART_PALETTE_STORAGE_KEY = 'moneyhooks-chart-palette'

export const CHART_PALETTES = [
  'default',
  'colorful',
  'monochrome',
] as const

export type ChartPalette = (typeof CHART_PALETTES)[number]

export const DEFAULT_CHART_PALETTE: ChartPalette = 'default'

export type ChartPaletteContextValue = {
  chartPalette: ChartPalette
  setChartPalette: (chartPalette: ChartPalette) => void
}

export const ChartPaletteContext = createContext<ChartPaletteContextValue | undefined>(
  undefined,
)

export function isChartPalette(value: string | null): value is ChartPalette {
  return value !== null && CHART_PALETTES.includes(value as ChartPalette)
}

export function useChartPalette() {
  const context = useContext(ChartPaletteContext)

  if (!context) {
    throw new Error('useChartPalette must be used within a ChartPaletteProvider')
  }

  return context
}
