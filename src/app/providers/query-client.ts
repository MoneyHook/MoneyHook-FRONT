import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
