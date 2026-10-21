import { bulkPersonalTransactions } from './bulk-personal-transactions'
import type { ShareResult } from './share-personal-transactions'

export function unsharePersonalTransactions(
  householdId: string,
  transactionIds: string[],
): Promise<ShareResult[]> {
  return bulkPersonalTransactions(householdId, transactionIds, 'unshare')
}
