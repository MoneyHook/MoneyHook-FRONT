import { LoaderCircle } from 'lucide-react'

import { Skeleton } from '@/shared/components/ui/skeleton'

import { Brand } from '../brand'

type FullScreenLoadingProps = {
  label?: string
}

export function FullScreenLoading({
  label = 'MoneyHooksを準備しています',
}: FullScreenLoadingProps) {
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
