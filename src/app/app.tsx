import { RouterProvider } from 'react-router-dom'

import { AppErrorBoundary } from '@/shared/components/app-error-boundary'

import { AppProviders } from './providers/app-providers'
import { router } from './router/router'

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}
