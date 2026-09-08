import { ErrorState } from '@/shared/components/app-state'
import type { AnalysisRange } from '../model/analysis-overview'
import { useAnalysisFixedController } from '../hooks/use-analysis-fixed-controller'
import { FixedSkeleton, EmptyFixed } from './fixed/fixed-analysis-states'
import { FixedSummaryPanel } from './fixed/fixed-summary-panel'
import { FixedBreakdownPanel } from './fixed/fixed-breakdown-panel'
import { FixedTrendPanel } from './fixed/fixed-trend-panel'
import { CategoryTrendTable } from './fixed/category-trend-table'
import { TransactionsPanel } from './fixed/fixed-transactions-panel'

export function AnalysisFixedContent({ range }: { range: AnalysisRange }) {
  const {
    fixed,
    selectedCategoryIds,
    selectedCategories,
    selectedTransactions,
    setCategories,
    openTransaction,
  } = useAnalysisFixedController(range)

  if (fixed.isPending) {
    return <FixedSkeleton />
  }

  if (fixed.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <ErrorState
          message={
            fixed.error instanceof Error
              ? fixed.error.message
              : '固定費分析データを取得できませんでした。'
          }
          onRetry={() => void fixed.refetch()}
          title="固定費分析を表示できません"
        />
      </div>
    )
  }

  if (!fixed.data || fixed.data.categories.length === 0) {
    return <EmptyFixed />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <FixedSummaryPanel data={fixed.data} />
      <FixedBreakdownPanel
        data={fixed.data}
        selectedCategoryIds={selectedCategoryIds}
      />
      <FixedTrendPanel data={fixed.data} />
      <CategoryTrendTable
        categories={selectedCategories}
        data={fixed.data}
        onCategoryChange={setCategories}
        selectedCategoryIds={selectedCategoryIds}
      />
      <TransactionsPanel items={selectedTransactions} onOpen={openTransaction} />
    </div>
  )
}
