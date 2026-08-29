import { AlertCircle, ArrowLeft, LoaderCircle, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { Brand } from './brand'

export function FullScreenLoading({
  label = 'MoneyHooksを準備しています',
}: {
  label?: string
}) {
  return (
    <main
      aria-busy="true"
      aria-label={label}
      className="flex min-h-svh items-center justify-center bg-background px-6"
    >
      <div className="w-full max-w-xs space-y-8 text-center">
        <Brand className="justify-center" />
        <div className="space-y-3" role="status">
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto size-5 animate-spin text-primary"
          />
          <p className="text-sm text-muted-foreground">{label}</p>
          <Skeleton className="mx-auto h-1.5 w-32" />
        </div>
      </div>
    </main>
  )
}

export function ErrorState({
  title = '問題が発生しました',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[50svh] w-full max-w-xl items-center px-6">
      <div className="w-full space-y-5">
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        {onRetry ? (
          <Button onClick={onRetry} variant="outline">
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            もう一度試す
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function NotFoundState({ withinApp = false }: { withinApp?: boolean }) {
  return (
    <div className="motion-route-enter mx-auto flex min-h-[55svh] w-full max-w-3xl items-center px-6 py-16">
      <div className="max-w-lg space-y-6">
        <p className="text-sm font-medium text-primary">404</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            ページが見つかりません
          </h1>
          <p className="leading-7 text-muted-foreground">
            URLが変更されたか、アクセスできないページです。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={withinApp ? '/app/home' : '/'}>
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
            {withinApp ? 'ホームへ戻る' : '最初のページへ戻る'}
          </Link>
        </Button>
      </div>
    </div>
  )
}
