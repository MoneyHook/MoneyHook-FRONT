import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function RecurringTransactionSettingsSkeleton() {
  return (
    <LoadingState label="自動入力を読み込んでいます">
      <div className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-60 max-w-full" />
        </div>
        <div className="divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="flex shrink-0 gap-1">
                {[0, 1, 2].map((action) => (
                  <Skeleton key={action} className="size-8" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  )
}
