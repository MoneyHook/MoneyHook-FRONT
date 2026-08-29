import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'

export const THEME_STORAGE_KEY = 'moneyhooks-theme'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
    >
      {children}
    </ThemeProvider>
  )
}
