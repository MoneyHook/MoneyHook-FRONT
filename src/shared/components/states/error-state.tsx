import { AlertCircle, RotateCcw } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = '問題が発生しました',
  message,
  onRetry,
}: ErrorStateProps) {
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
