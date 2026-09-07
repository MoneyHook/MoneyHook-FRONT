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
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8 md:px-8 md:pb-10"
    >
      <AnalysisHeader getViewLink={getViewLink} onRangeChange={setRange} selection={selection} view={view} />
      <div className="mt-5 sm:mt-6">
        {view === 'overview' ? <OverviewContent getViewLink={getViewLink} range={selection.range} /> : null}
        {view === 'categories' ? <AnalysisCategoriesContent range={selection.range} /> : null}
        {view === 'fixed' ? <AnalysisFixedContent range={selection.range} /> : null}
        {view === 'payments' ? <AnalysisPaymentsContent range={selection.range} /> : null}
      </div>
    </section>
  )
}
