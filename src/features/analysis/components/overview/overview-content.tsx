import { ErrorState } from '@/shared/components/app-state'
import { useAnalysisOverview } from '../../api/use-analysis-overview'
import { analysisChartColors } from '../analysis-chart-colors'
import type { AnalysisRange } from '../../model/analysis-overview'
import type { AnalysisView } from '../../model/analysis-navigation'
import { SummaryPanel } from './overview-summary-panel'
import { SpendingTrendPanel } from './overview-spending-trend-panel'
import { BreakdownPanel } from './overview-breakdown-panel'
import { ChangesPanel } from './overview-changes-panel'
import { HighlightsPanel } from './overview-highlights-panel'
import { OverviewSkeleton } from './overview-skeleton'

export function OverviewContent({ range, getViewLink }: {
  range: AnalysisRange
  getViewLink: (view: AnalysisView) => { search: string }
}) {
  const overview = useAnalysisOverview(range)

  if (overview.isPending) {
    return <OverviewSkeleton />
  }

  if (overview.isError) {
    return (
      <>
        <ErrorState
          message={
            overview.error instanceof Error
              ? overview.error.message
              : '分析データを取得できませんでした。'
          }
          onRetry={() => void overview.refetch()}
          title="分析を表示できません"
        />
      </>
    )
  }

  if (!overview.data) {
    return null
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <SummaryPanel data={overview.data} />
      <SpendingTrendPanel data={overview.data} />
      <div className="grid gap-3 min-[400px]:grid-cols-2 sm:gap-4">
        <BreakdownPanel
          chartLabel="カテゴリ別支出の割合"
          colors={analysisChartColors}
          items={overview.data.categories}
          linkLabel="すべてのカテゴリを見る"
          linkTo={getViewLink('categories')}
          title="カテゴリ別支出（上位5件）"
        />
        <BreakdownPanel
          chartLabel="固定費カテゴリの割合"
          colors={analysisChartColors}
          items={overview.data.fixedCategories}
          linkLabel="固定費の詳細を見る"
          linkTo={getViewLink('fixed')}
          title="固定費の内訳"
        />
      </div>
      <ChangesPanel data={overview.data} />
      <HighlightsPanel data={overview.data} />
    </div>
  )
}
