import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { type AnalysisView, normalizeView } from '../model/analysis-navigation'
import { resolveAnalysisRange } from '../model/analysis-overview'

export function useAnalysisDashboardController() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view = normalizeView(rawView)
  const selection = resolveAnalysisRange({
    startMonth: searchParams.get('startMonth'),
    endMonth: searchParams.get('endMonth'),
  })

  useEffect(() => {
    if (rawView === null || rawView === view) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('view', view)
    setSearchParams(next, { replace: true })
  }, [rawView, searchParams, setSearchParams, view])

  const setRange = (startMonth: string, endMonth: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('startMonth', startMonth)
    next.set('endMonth', endMonth)
    setSearchParams(next)
  }

  const getViewLink = (nextView: AnalysisView) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', nextView)
    return { search: `?${next.toString()}` }
  }

  return { view, selection, setRange, getViewLink }
}
