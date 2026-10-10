import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  AnalysisChartSkeleton,
  AnalysisMetricsSkeleton,
} from '../analysis-skeleton-parts'
import { AnalysisPanel } from './overview-analysis-panel'

export function OverviewSkeleton() {
  return (
    <LoadingState
      label="分析概要を読み込んでいます"
      className="space-y-3 sm:space-y-4"
    >
      <AnalysisPanel className="p-3 sm:p-6">
        <Skeleton className="h-5 w-24 sm:h-7" />
        <AnalysisMetricsSkeleton />
      </AnalysisPanel>
      <AnalysisPanel className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 sm:h-7" />
          <Skeleton className="h-9 w-16" />
        </div>
        <AnalysisChartSkeleton className="mt-2 h-40 sm:mt-6 sm:h-72" />
      </AnalysisPanel>
      <div className="grid gap-3 min-[400px]:grid-cols-2 sm:gap-4">
        {[0, 1].map((index) => (
          <AnalysisPanel
            key={index}
            className="flex min-w-0 flex-col p-3 sm:p-6"
          >
            <Skeleton className="h-5 w-3/4 sm:h-7" />
            <div className="mt-3 grid min-h-28 flex-1 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-1.5 sm:mt-5 sm:min-h-40 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
              <Skeleton className="size-18 rounded-full border-8 border-muted bg-transparent sm:size-32 sm:border-12" />
              <div className="space-y-1.5 sm:space-y-2.5">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="space-y-0.5">
                    <Skeleton className="h-3.5 w-full sm:h-4" />
                    <Skeleton className="h-3.5 w-2/3 sm:h-4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex min-h-11 items-center border-t pt-3">
              <Skeleton className="h-5 w-2/3" />
            </div>
          </AnalysisPanel>
        ))}
      </div>
      <AnalysisPanel>
        <Skeleton className="h-5 w-40 sm:h-7" />
        <div className="mt-4 grid gap-4 min-[400px]:grid-cols-2 min-[400px]:divide-x sm:mt-5 sm:gap-5">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-3 min-[400px]:px-3">
              <Skeleton className="h-4 w-24" />
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </AnalysisPanel>
      <AnalysisPanel>
        <Skeleton className="h-5 w-40 sm:h-7" />
        <div className="mt-4 grid gap-3 min-[400px]:grid-cols-2">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="flex gap-3 rounded-xl bg-background p-3 sm:p-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </AnalysisPanel>
    </LoadingState>
  )
}
