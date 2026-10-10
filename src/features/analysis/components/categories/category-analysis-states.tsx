import { Tags } from 'lucide-react'

import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  AnalysisChartSkeleton,
  AnalysisLegendSkeleton,
  AnalysisTransactionsSkeleton,
} from '../analysis-skeleton-parts'
import { CategoryAnalysisPanel } from './category-analysis-panel'

export function CategoriesSkeleton() {
  return (
    <LoadingState
      label="カテゴリ分析を読み込んでいます"
      className="mx-auto max-w-5xl space-y-3 sm:space-y-4"
    >
      <CategoryAnalysisPanel>
        <Skeleton className="h-6 w-40 sm:h-7" />
        <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
          <Skeleton className="mx-auto size-36 rounded-full border-12 border-muted bg-transparent sm:size-56 sm:border-20" />
          <AnalysisLegendSkeleton count={6} />
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </CategoryAnalysisPanel>
      <CategoryAnalysisPanel>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="mt-5 grid items-center gap-5 min-[390px]:grid-cols-[minmax(0,1fr)_10rem] sm:grid-cols-[minmax(0,1fr)_14rem] sm:gap-10">
          <AnalysisLegendSkeleton count={3} />
          <Skeleton className="mx-auto size-40 rounded-full border-12 border-muted bg-transparent sm:size-52 sm:border-16" />
        </div>
      </CategoryAnalysisPanel>
      <CategoryAnalysisPanel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-36 sm:h-7" />
          <Skeleton className="h-10 w-28" />
        </div>
        <AnalysisChartSkeleton className="mt-4 h-52 sm:h-72" />
      </CategoryAnalysisPanel>
      <AnalysisTransactionsSkeleton />
    </LoadingState>
  )
}

export function EmptyCategories() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <CategoryAnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <Tags aria-hidden="true" className="size-8 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">この期間の支出はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          支出を記録するとカテゴリ別の傾向を確認できます。
        </p>
      </CategoryAnalysisPanel>
    </div>
  )
}
