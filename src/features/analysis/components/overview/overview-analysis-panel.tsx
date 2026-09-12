import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

export function AnalysisPanel({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <Card className={cn('block p-4 sm:p-6', className)}>{children}</Card>
}
