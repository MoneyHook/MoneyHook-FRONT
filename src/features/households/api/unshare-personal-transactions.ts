import {
  householdShareStatus,
  householdUnshare,
} from '@/shared/api/generated/household/household'

import type { ShareResult } from './share-personal-transactions'

export async function unsharePersonalTransactions(
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
        throw new Error('退出時の控えは共有解除できません。')
      if (status.data.state !== 'active') {
        results.push({ transactionId, outcome: 'already-unshared' })
      } else {
        if (
          status.data.kind !== 'shared' ||
          !Number.isInteger(status.data.version) ||
          status.data.version < 1
        )
          throw new Error('共有の最新情報を取得できませんでした。')
        const response = await householdUnshare(householdId, transactionId, {
          expected_version: status.data.version,
        })
        if (response.status !== 204)
          throw new Error('共有を解除できませんでした。')
        results.push({ transactionId, outcome: 'unshared' })
      }
    } catch (error) {
      results.push({
        transactionId,
        outcome: 'failed',
        message:
          error instanceof Error
            ? error.message
            : '共有を解除できませんでした。',
      })
    }
  }
  return results
}
