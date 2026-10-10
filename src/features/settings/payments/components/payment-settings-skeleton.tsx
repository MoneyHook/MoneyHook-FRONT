import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function PaymentSettingsSkeleton() {
  return (
    <LoadingState label="支払い方法を読み込んでいます">
      <div className="space-y-5">
        <div className="space-y-2 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-8 w-full sm:max-w-sm" />
        </div>
        <div className="divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-6 w-4 shrink-0" />
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-4/5" />
              </div>
              <div className="flex shrink-0 gap-1">
                <Skeleton className="size-8" />
                <Skeleton className="size-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  )
}
