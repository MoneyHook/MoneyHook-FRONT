import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { AccentProvider } from '@/shared/hooks/accent-provider'
import { ChartPaletteProvider } from '@/shared/hooks/chart-palette-provider'

import { createAppQueryClient } from './query-client'
import { AppThemeProvider } from './theme-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <AppThemeProvider>
      <AccentProvider>
        <ChartPaletteProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={250}>
              <AuthProvider>{children}</AuthProvider>
              <Toaster position="bottom-center" />
            </TooltipProvider>
          </QueryClientProvider>
        </ChartPaletteProvider>
      </AccentProvider>
    </AppThemeProvider>
  )
}
