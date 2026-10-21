import {
  householdBulkShare,
  householdBulkUnshare,
} from '@/shared/api/generated/household/household'

import type { ShareResult } from './share-personal-transactions'

export async function bulkPersonalTransactions(
  householdId: string,
  transactionIds: string[],
  operation: 'share' | 'unshare',
): Promise<ShareResult[]> {
  const ids = [...new Set(transactionIds)]
  const results: ShareResult[] = []
  const update =
    operation === 'share' ? householdBulkShare : householdBulkUnshare
  for (let offset = 0; offset < ids.length; offset += 1000) {
    const batch = ids.slice(offset, offset + 1000)
    try {
      const response = await update(householdId, { transaction_ids: batch })
      if (response.status !== 200) throw new Error('処理に失敗しました。')
      results.push(
        ...response.data.results.map((result) => ({
          transactionId: result.transaction_id,
          outcome: result.outcome,
          message: result.message,
        })),
      )
    } catch (error) {
      results.push(
        ...batch.map((transactionId): ShareResult => ({
          transactionId,
          outcome: 'failed',
          message:
            error instanceof Error ? error.message : '処理に失敗しました。',
        })),
      )
    }
  }
  return results
}
