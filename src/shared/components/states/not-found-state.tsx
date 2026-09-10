import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'

type NotFoundStateProps = {
  withinApp?: boolean
}

export function NotFoundState({ withinApp = false }: NotFoundStateProps) {
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
