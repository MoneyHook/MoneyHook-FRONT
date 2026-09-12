import type { PropsWithChildren } from 'react'

import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

export function CategoryAnalysisPanel({
  children,
  className,
  id,
}: PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <Card className={cn('block p-4 sm:p-6', className)} id={id}>
      {children}
    </Card>
  )
}
