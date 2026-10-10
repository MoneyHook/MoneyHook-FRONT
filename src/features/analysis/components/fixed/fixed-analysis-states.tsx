import { WalletCards } from 'lucide-react'

import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  AnalysisChartSkeleton,
  AnalysisLegendSkeleton,
  AnalysisMetricsSkeleton,
  AnalysisTransactionsSkeleton,
} from '../analysis-skeleton-parts'
import { AnalysisPanel } from './fixed-analysis-panel'

export function FixedSkeleton() {
  return (
    <LoadingState
      label="固定費分析を読み込んでいます"
      className="mx-auto max-w-5xl space-y-3 sm:space-y-4"
    >
      <AnalysisPanel className="p-3 sm:p-6">
        <Skeleton className="h-5 w-36 sm:h-7" />
        <AnalysisMetricsSkeleton className="h-6 sm:h-9" />
      </AnalysisPanel>
      <AnalysisPanel>
        <Skeleton className="h-6 w-40 sm:h-7" />
        <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 min-[390px]:grid-cols-[9rem_minmax(0,1fr)] sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
          <Skeleton className="mx-auto size-36 rounded-full border-12 border-muted bg-transparent sm:size-56 sm:border-20" />
          <AnalysisLegendSkeleton count={5} />
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </AnalysisPanel>
      <AnalysisPanel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-36 sm:h-7" />
          <Skeleton className="h-9 w-28" />
        </div>
        <AnalysisChartSkeleton className="mt-4 h-52 sm:h-72" />
      </AnalysisPanel>
      <AnalysisPanel className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-28 self-end sm:self-auto" />
        </div>
        <div className="divide-y border-t">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex min-h-16 items-center gap-3 px-4 py-3 sm:min-h-12 sm:px-6"
            >
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <Skeleton className="h-4 min-w-0 flex-1" />
              <div className="hidden flex-1 gap-4 sm:flex">
                {[0, 1, 2].map((column) => (
                  <Skeleton key={column} className="h-4 min-w-0 flex-1" />
                ))}
              </div>
              <Skeleton className="h-5 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </AnalysisPanel>
      <AnalysisTransactionsSkeleton />
    </LoadingState>
  )
}

export function EmptyFixed() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <AnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <WalletCards
          aria-hidden="true"
          className="size-8 text-muted-foreground"
        />
        <h2 className="mt-4 font-semibold">この期間の固定費はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          固定費を記録すると月別の推移と年間換算を確認できます。
        </p>
      </AnalysisPanel>
    </div>
  )
}
