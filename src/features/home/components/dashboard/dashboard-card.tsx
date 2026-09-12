import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/components/ui/card'

export function DashboardCard({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={cn('block p-5 sm:p-6', 'max-sm:p-3', className)}>
      {children}
    </Card>
  )
}
