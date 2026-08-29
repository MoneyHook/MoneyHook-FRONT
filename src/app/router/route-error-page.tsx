import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from '@/shared/components/app-state'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `画面を表示できませんでした（${error.status}）。`
    : '予期しないエラーが発生しました。'

  return (
    <main className="flex min-h-svh items-center bg-background">
      <ErrorState
        message={message}
        onRetry={() => window.location.reload()}
      />
    </main>
  )
}
