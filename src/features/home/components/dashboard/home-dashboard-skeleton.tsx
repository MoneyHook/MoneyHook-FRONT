import { Skeleton } from '@/shared/components/ui/skeleton'

export function HomeDashboardSkeleton() {
  return (
    <div aria-label="ホーム画面を読み込んでいます" className="space-y-4" role="status">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <Skeleton className="h-112 rounded-2xl" />
        <Skeleton className="h-112 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
