import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function FamilySummarySkeleton() {
  return (
    <LoadingState
      label="収支を読み込んでいます"
      className="grid grid-cols-1 gap-5 border-y py-6 sm:grid-cols-3 sm:gap-6"
    >
      <div className="space-y-2 sm:border-r sm:pr-6">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-40 sm:h-10" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:gap-6">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-3/4 sm:h-8" />
          </div>
        ))}
      </div>
    </LoadingState>
  )
}

export function FamilyEntriesSkeleton({
  sharing = false,
}: {
  sharing?: boolean
}) {
  return (
    <LoadingState
      label={sharing ? '取引を読み込んでいます' : '記録を読み込んでいます'}
      className="divide-y"
    >
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex items-start justify-between gap-4 px-2 py-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0" />
        </div>
      ))}
    </LoadingState>
  )
}

export function FamilyEntryDetailSkeleton() {
  return (
    <LoadingState
      label="家族の情報を読み込んでいます"
      className="space-y-4 border-t pt-4"
    >
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
    </LoadingState>
  )
}

export function FamilyShareSkeleton() {
  return (
    <LoadingState
      label="共有状態を読み込んでいます"
      className="mx-auto w-full max-w-2xl space-y-3 border-t px-5 py-5 pb-28"
    >
      <Skeleton className="h-6 w-40" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
      <Skeleton className="h-9 w-44" />
    </LoadingState>
  )
}

export function FamilySettingsSkeleton({
  showOverview = true,
}: {
  showOverview?: boolean
}) {
  return (
    <LoadingState label="家族を読み込んでいます" className="space-y-5">
      {showOverview && (
        <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-36" />
        </div>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-5">
          <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="space-y-1">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="space-y-6 border-t pt-5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 min-w-0 flex-1" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
          <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="space-y-1">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-2 border-t pt-5">
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-3">
                <Skeleton className="h-10 min-w-0 flex-1" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            <div className="divide-y border-t">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3 py-4">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </LoadingState>
  )
}
