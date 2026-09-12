import { WalletCards } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AnalysisPanel } from './fixed-analysis-panel'

export function FixedSkeleton() {
  return (
    <div
      aria-label="固定費分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
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
