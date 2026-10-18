import {
  householdShare,
  householdShareStatus,
} from '@/shared/api/generated/household/household'
import { getV1Transaction } from '@/shared/api/generated/transaction/transaction'

export type ShareResult = {
  transactionId: string
  outcome:
    'shared' | 'already-shared' | 'unshared' | 'already-unshared' | 'failed'
  message?: string
}

// Each transaction is independent; retries always read the latest versions.
export async function sharePersonalTransactions(
  householdId: string,
  transactionIds: string[],
): Promise<ShareResult[]> {
  const results: ShareResult[] = []
  for (const transactionId of [...new Set(transactionIds)]) {
    try {
      const status = await householdShareStatus(householdId, transactionId)
      if (status.status !== 200)
        throw new Error('共有状態を取得できませんでした。')
      if (status.data.kind === 'snapshot')
        throw new Error(
          '退出時の控えが残っているため、この取引は再共有できません。',
        )
      if (status.data.state === 'active') {
        results.push({ transactionId, outcome: 'already-shared' })
      } else {
        const response = await getV1Transaction(transactionId)
        if (response.status !== 200 || !response.data.transaction.version)
          throw new Error('取引の最新情報を取得できませんでした。')
        const shared = await householdShare(householdId, transactionId, {
          source_version: response.data.transaction.version,
          expected_version: status.data.version || undefined,
        })
        if (shared.status !== 200) throw new Error('共有できませんでした。')
        results.push({ transactionId, outcome: 'shared' })
      }
    } catch (error) {
      results.push({
        transactionId,
        outcome: 'failed',
        message:
          error instanceof Error ? error.message : '共有できませんでした。',
      })
    }
  }
  return results
}
