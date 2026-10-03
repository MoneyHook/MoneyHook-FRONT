import { TransactionsView } from '@/features/transactions'

import { LegacyFamilyRedirect } from '../households/family-page'

export function TransactionsPage() {
  return (
    <LegacyFamilyRedirect>
      <TransactionsView />
    </LegacyFamilyRedirect>
  )
}
