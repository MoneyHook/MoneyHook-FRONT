import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function BudgetSettingsSkeleton() {
  return (
    <LoadingState label="予算設定を読み込んでいます">
      <div className="space-y-5">
        <div className="max-w-md space-y-2">
          <Skeleton className="h-5 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-5 w-4" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </LoadingState>
  )
}
