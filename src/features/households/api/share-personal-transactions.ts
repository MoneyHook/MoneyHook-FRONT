import { bulkPersonalTransactions } from './bulk-personal-transactions'

export type ShareResult = {
  transactionId: string
  outcome:
    'shared' | 'already-shared' | 'unshared' | 'already-unshared' | 'failed'
  message?: string
}

export function sharePersonalTransactions(
  householdId: string,
  transactionIds: string[],
): Promise<ShareResult[]> {
  return bulkPersonalTransactions(householdId, transactionIds, 'share')
}
