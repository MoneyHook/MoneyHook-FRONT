import { HomeDashboard } from '@/features/home'
import { useHouseholds } from '@/features/households'

import { LegacyFamilyRedirect } from '../households/family-page'

export function HomePage() {
  const families = useHouseholds()
  const hasActiveFamily =
    families.isSuccess &&
    families.data.some((family) => family.state === 'active')

  return (
    <LegacyFamilyRedirect>
      <HomeDashboard hasActiveFamily={hasActiveFamily} />
    </LegacyFamilyRedirect>
  )
}
