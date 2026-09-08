import { Tags } from 'lucide-react'

import { Skeleton } from '@/shared/components/ui/skeleton'

import { CategoryAnalysisPanel } from './category-analysis-panel'

export function CategoriesSkeleton() {
  return (
    <div
      aria-label="カテゴリ分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
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
