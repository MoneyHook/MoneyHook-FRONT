import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

export function AnalysisMetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className="mt-3 grid grid-cols-3 divide-x sm:mt-6">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="min-w-0 space-y-1 px-2 first:pl-0 last:pr-0 sm:px-7"
        >
          <Skeleton className="h-3 w-12 max-w-full sm:h-5 sm:w-20" />
          <Skeleton className={cn('h-3 w-3/4 sm:h-9', className)} />
          <Skeleton className="h-2 w-4/5 sm:h-5" />
        </div>
      ))}
    </div>
  )
}

export function AnalysisChartSkeleton({ className }: { className: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Skeleton className="min-h-0 flex-1 rounded-lg" />
      <div className="flex justify-between">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-3 w-6 sm:w-10" />
        ))}
      </div>
    </div>
  )
}

export function AnalysisLegendSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="min-w-0 space-y-0.5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex min-h-10 items-center gap-2">
          <Skeleton className="size-6 shrink-0 rounded-full sm:size-8" />
          <Skeleton className="h-3 min-w-0 flex-1 sm:h-4" />
          <div className="w-14 shrink-0 space-y-1 sm:w-24">
            <Skeleton className="h-3 w-full sm:h-4" />
            <Skeleton className="ml-auto h-2 w-2/3 sm:h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AnalysisTransactionsSkeleton() {
  return (
    <Card className="block overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="divide-y border-t px-3 sm:px-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="flex items-center gap-3 py-3">
            <Skeleton className="h-4 w-16 shrink-0 sm:w-28" />
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0 sm:w-24" />
          </div>
        ))}
      </div>
    </Card>
  )
}
