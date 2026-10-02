import { AnalysisDashboard } from '@/features/analysis'

import { LegacyFamilyRedirect } from '../households/family-page'

export function AnalysisPage() {
  return (
    <LegacyFamilyRedirect analysis>
      <AnalysisDashboard />
    </LegacyFamilyRedirect>
  )
}
