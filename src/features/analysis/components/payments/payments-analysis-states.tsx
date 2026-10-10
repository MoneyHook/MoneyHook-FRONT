import { WalletCards } from 'lucide-react'

import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  AnalysisChartSkeleton,
  AnalysisLegendSkeleton,
} from '../analysis-skeleton-parts'
import { AnalysisPanel } from './payments-analysis-panel'

export function PaymentsSkeleton() {
  return (
    <LoadingState
      label="支払い方法分析を読み込んでいます"
      className="mx-auto max-w-5xl space-y-3 sm:space-y-4"
    >
      <AnalysisPanel>
        <Skeleton className="h-6 w-40 sm:h-7" />
        <div className="mx-auto mt-4 grid max-w-4xl grid-cols-[9rem_minmax(0,1fr)] items-center gap-4 sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
          <Skeleton className="mx-auto size-36 rounded-full border-12 border-muted bg-transparent sm:size-56 sm:border-20" />
          <AnalysisLegendSkeleton count={3} />
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </AnalysisPanel>
      <AnalysisPanel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-36 sm:h-7" />
          <Skeleton className="h-9 w-28" />
        </div>
        <AnalysisChartSkeleton className="mt-4 h-56 sm:h-72" />
        <Skeleton className="mx-auto mt-3 h-4 w-40" />
      </AnalysisPanel>
      <AnalysisPanel className="overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="divide-y border-t">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex min-h-20 items-center gap-3 px-4 py-3 sm:min-h-24 sm:px-6"
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="w-20 shrink-0 space-y-2">
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

export function EmptyPayments() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <AnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <WalletCards
          aria-hidden="true"
          className="size-8 text-muted-foreground"
        />
        <h2 className="mt-4 font-semibold">この期間の支出はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          支払い方法を設定して支出を記録すると、方法別の傾向を確認できます。
        </p>
      </AnalysisPanel>
    </div>
  )
}
