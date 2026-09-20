import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'

import { AppErrorBoundary } from '@/shared/components/app-error-boundary'
import { FullScreenLoading } from '@/shared/components/app-state'

import { AppProviders } from './providers/app-providers'
import { router } from './router/router'

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <Suspense fallback={<FullScreenLoading />}>
          <RouterProvider router={router} />
        </Suspense>
      </AppProviders>
    </AppErrorBoundary>
  )
}
