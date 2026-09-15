import { WalletCards } from 'lucide-react'

import { Skeleton } from '@/shared/components/ui/skeleton'

import { AnalysisPanel } from './payments-analysis-panel'

export function PaymentsSkeleton() {
  return (
    <div
      aria-label="支払い方法分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
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
