import { createContext, useContext } from 'react'

export const ACCENT_STORAGE_KEY = 'moneyhooks-accent'

export const ACCENT_COLORS = [
  'blue',
  'green',
  'violet',
  'rose',
  'black',
] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]

export const DEFAULT_ACCENT: AccentColor = 'blue'

export type AccentContextValue = {
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

export const AccentContext = createContext<AccentContextValue | undefined>(
  undefined,
)

export function isAccentColor(value: string | null): value is AccentColor {
  return value !== null && ACCENT_COLORS.includes(value as AccentColor)
}

export function useAccent() {
  const context = useContext(AccentContext)

  if (!context) {
    throw new Error('useAccent must be used within an AccentProvider')
  }

  return context
}
