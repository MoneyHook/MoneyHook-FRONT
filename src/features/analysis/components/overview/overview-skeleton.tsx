import { Skeleton } from '@/shared/components/ui/skeleton'

export function OverviewSkeleton() {
  return (
    <div aria-label="分析概要を読み込んでいます" className="space-y-4" role="status">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}
