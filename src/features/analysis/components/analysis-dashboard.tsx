import { useEffect, useState } from 'react'

import { useAnalysisDashboardController } from '../hooks/use-analysis-dashboard-controller'
import { AnalysisCategoriesContent } from './analysis-categories'
import { AnalysisFixedContent } from './analysis-fixed'
import { AnalysisPaymentsContent } from './analysis-payments'
import { AnalysisHeader } from './overview/analysis-header'
import { OverviewContent } from './overview/overview-content'

export function AnalysisDashboard() {
  const { view, selection, setRange, getViewLink } =
    useAnalysisDashboardController()
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const updateHeader = () => {
      const scrollTop = window.scrollY
      setIsHeaderCompact((compact) =>
        compact ? scrollTop > 0 : scrollTop > 16,
      )
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [view])

  return (
    <section
      aria-labelledby="analysis-page-title"
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pt-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 md:px-8 md:pt-6 md:pb-10"
    >
      <div
        className={`sticky top-0 z-20 bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'pt-1' : 'pt-2 sm:pt-3'}`}
      >
        <AnalysisHeader
          compact={isHeaderCompact}
          getViewLink={getViewLink}
          onRangeChange={setRange}
          selection={selection}
          view={view}
        />
      </div>
      <div key={view} className="pt-4 sm:pt-5" data-slot="analysis-content">
        {view === 'overview' ? (
          <OverviewContent getViewLink={getViewLink} range={selection.range} />
        ) : null}
        {view === 'categories' ? (
          <AnalysisCategoriesContent range={selection.range} />
        ) : null}
        {view === 'fixed' ? (
          <AnalysisFixedContent range={selection.range} />
        ) : null}
        {view === 'payments' ? (
          <AnalysisPaymentsContent range={selection.range} />
        ) : null}
      </div>
    </section>
  )
}
