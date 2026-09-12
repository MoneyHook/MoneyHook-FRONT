import { ErrorState } from '@/shared/components/app-state'

import { useAnalysisCategoriesController } from '../hooks/use-analysis-categories-controller'
import type { AnalysisRange } from '../model/analysis-overview'
import {
  CategoriesSkeleton,
  EmptyCategories,
} from './categories/category-analysis-states'
import { CategorySummaryPanel } from './categories/category-summary-panel'
import { CategoryTransactionsPanel } from './categories/category-transactions-panel'
import { CategoryTrendPanel } from './categories/category-trend-panel'
import { SubcategoryPanel } from './categories/subcategory-panel'

export function AnalysisCategoriesContent({ range }: { range: AnalysisRange }) {
  const {
    categories,
    selectedCategory,
    group,
    listMode,
    changeCategory,
    changeListMode,
    changeGroup,
    openTransaction,
  } = useAnalysisCategoriesController(range)

  if (categories.isPending) {
    return <CategoriesSkeleton />
  }

  if (categories.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <ErrorState
          message={
            categories.error instanceof Error
              ? categories.error.message
              : 'カテゴリ分析データを取得できませんでした。'
          }
          onRetry={() => void categories.refetch()}
          title="カテゴリ分析を表示できません"
        />
      </div>
    )
  }

  if (!categories.data || !selectedCategory) {
    return <EmptyCategories />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <CategorySummaryPanel
        data={categories.data}
        listMode={listMode}
        onCategoryChange={changeCategory}
        onListModeChange={changeListMode}
        selectedCategory={selectedCategory}
      />
      <SubcategoryPanel category={selectedCategory} />
      <CategoryTrendPanel
        category={selectedCategory}
        group={group}
        onGroupChange={changeGroup}
      />
      <CategoryTransactionsPanel
        category={selectedCategory}
        onOpen={openTransaction}
      />
    </div>
  )
}
