import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { AuthProvider } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { useIsMobile } from '@/shared/hooks/use-mobile'

import { AppearanceProvider } from './appearance-provider'
import { createAppQueryClient } from './query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient)
  const isMobile = useIsMobile()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppearanceProvider>
          <TooltipProvider delayDuration={250}>
            {children}
            <Toaster position={isMobile ? 'top-center' : 'bottom-right'} />
          </TooltipProvider>
        </AppearanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
