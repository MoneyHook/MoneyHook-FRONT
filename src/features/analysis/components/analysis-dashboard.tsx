import { AnalysisCategoriesContent } from './analysis-categories'
import { AnalysisFixedContent } from './analysis-fixed'
import { AnalysisPaymentsContent } from './analysis-payments'
import { useAnalysisDashboardController } from '../hooks/use-analysis-dashboard-controller'
import { AnalysisHeader } from './overview/analysis-header'
import { OverviewContent } from './overview/overview-content'

export function AnalysisDashboard() {
  const {
    view,
    selection,
    setRange,
    getViewLink,
  } = useAnalysisDashboardController()

  return (
    <section
      aria-labelledby="analysis-page-title"
      className="motion-route-enter mx-auto flex h-svh min-h-0 w-full max-w-7xl flex-col overflow-hidden px-4 pt-3 sm:px-6 sm:pt-5 md:px-8"
    >
      <AnalysisHeader getViewLink={getViewLink} onRangeChange={setRange} selection={selection} view={view} />
      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pt-5 md:pb-2" data-slot="analysis-scroll-area">
        {view === 'overview' ? <OverviewContent getViewLink={getViewLink} range={selection.range} /> : null}
        {view === 'categories' ? <AnalysisCategoriesContent range={selection.range} /> : null}
        {view === 'fixed' ? <AnalysisFixedContent range={selection.range} /> : null}
        {view === 'payments' ? <AnalysisPaymentsContent range={selection.range} /> : null}
      </div>
    </section>
  )
}
