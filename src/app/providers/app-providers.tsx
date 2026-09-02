import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { AppearanceProvider } from '@/shared/hooks/appearance-provider'

import { createAppQueryClient } from './query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppearanceProvider>
          <TooltipProvider delayDuration={250}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AppearanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
