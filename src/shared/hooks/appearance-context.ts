import { createContext, useContext } from 'react'

export const THEME_MODES = ['light', 'dark', 'system'] as const
export const ACCENT_COLORS = ['blue', 'green', 'violet', 'rose', 'black'] as const
export const CHART_PALETTES = ['default', 'colorful', 'monochrome'] as const

export type ThemeMode = (typeof THEME_MODES)[number]
export type AccentColor = (typeof ACCENT_COLORS)[number]
export type ChartPalette = (typeof CHART_PALETTES)[number]

export type AppearanceSettings = {
  theme: ThemeMode
  accent: AccentColor
  chartPalette: ChartPalette
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
  accent: 'blue',
  chartPalette: 'default',
}

export type AppearanceContextValue = AppearanceSettings & {
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
  setChartPalette: (chartPalette: ChartPalette) => void
}

export const AppearanceContext = createContext<AppearanceContextValue | undefined>(
  undefined,
)

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return context
}
