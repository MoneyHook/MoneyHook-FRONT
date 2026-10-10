import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { DashboardCard } from './dashboard-card'

export function HomeDashboardSkeleton() {
  return (
    <LoadingState
      label="ホーム画面を読み込んでいます"
      className="space-y-3 sm:space-y-4"
    >
      <DashboardCard>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 pt-0.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-9 w-36 sm:mt-5 sm:h-12 sm:w-56" />
            <Skeleton className="mt-1 h-4 w-28 sm:mt-2 sm:h-5 sm:w-44" />
          </div>
          <Skeleton className="size-20 shrink-0 rounded-full border-8 border-muted bg-transparent sm:size-36 sm:border-12" />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x sm:mt-7">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex min-w-0 gap-2 px-2 first:pl-0 last:pr-0 sm:gap-3 sm:px-5"
            >
              <Skeleton className="size-7 shrink-0 rounded-full sm:size-9" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-2 w-3/4 sm:h-4" />
                <Skeleton className="h-3 w-full sm:h-6" />
                <Skeleton className="h-2 w-2/3 sm:h-5" />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
      <DashboardCard>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-36 sm:h-7" />
          <Skeleton className="h-4 w-24 sm:w-36" />
        </div>
        <Skeleton className="mt-2 h-36 w-full rounded-lg sm:mt-5 sm:h-64" />
      </DashboardCard>
      <div className="grid gap-3 min-[400px]:grid-cols-[1.08fr_0.92fr] sm:gap-4">
        <DashboardCard className="flex min-h-full flex-col">
          <Skeleton className="h-5 w-40 sm:h-7" />
          <div className="mt-2 space-y-1.5 sm:mt-5 sm:space-y-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full sm:size-9" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-3 w-1/2 sm:h-4" />
                  <Skeleton className="h-1 w-full sm:h-1.5" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-3 w-16 sm:h-4" />
                  <Skeleton className="ml-auto h-2.5 w-12 sm:h-4" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="mx-auto mt-1 h-6 w-24 shrink-0 sm:mt-5 sm:h-9" />
        </DashboardCard>
        <DashboardCard>
          <Skeleton className="h-5 w-32 sm:h-7" />
          <Skeleton className="mt-1 h-3 w-2/3 sm:h-4" />
          <Skeleton className="mt-1 h-7 w-full sm:h-10" />
          <div className="mt-2 space-y-2 sm:mt-5 sm:space-y-4">
            {[0, 1].map((index) => (
              <div key={index} className="rounded-xl bg-muted/40 p-2 sm:p-4">
                <Skeleton className="h-5 w-3/4" />
                <div className="mt-2 flex justify-between gap-2 sm:mt-5">
                  <Skeleton className="h-4 w-1/2 sm:h-6" />
                  <Skeleton className="h-4 w-1/3 sm:h-6" />
                </div>
                <Skeleton className="mt-1 h-3.5 w-full sm:mt-2 sm:h-5" />
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      <DashboardCard>
        <Skeleton className="h-4 w-32 sm:h-7" />
        <div className="mt-2 grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-2 sm:mt-5 sm:grid-cols-[minmax(14rem,0.8fr)_1.2fr] sm:gap-6">
          <div className="rounded-xl bg-muted/40 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Skeleton className="size-8 shrink-0 rounded-full sm:size-10" />
              <div className="flex-1">
                <Skeleton className="h-3 w-8 sm:h-4" />
                <Skeleton className="h-5 w-3/4 sm:mt-1 sm:h-8" />
              </div>
            </div>
            <Skeleton className="mt-1.5 h-3.5 w-full sm:mt-4 sm:h-5" />
          </div>
          <div>
            <Skeleton className="h-2.5 w-4/5 sm:h-4" />
            <Skeleton className="h-5 w-1/2 sm:mt-1 sm:h-8" />
            <Skeleton className="mt-1 h-1.5 w-full sm:mt-3 sm:h-2" />
            <div className="mt-1 border-t pt-1 sm:mt-5 sm:pt-3">
              <Skeleton className="ml-auto h-6 w-3/4 sm:h-7" />
            </div>
          </div>
        </div>
      </DashboardCard>
    </LoadingState>
  )
}
