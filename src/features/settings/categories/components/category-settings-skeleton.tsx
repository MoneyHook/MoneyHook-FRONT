import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function CategorySettingsSkeleton() {
  return (
    <LoadingState label="カテゴリを読み込んでいます">
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3 sm:px-5"
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="ml-auto size-4" />
          </div>
        ))}
      </div>
    </LoadingState>
  )
}
