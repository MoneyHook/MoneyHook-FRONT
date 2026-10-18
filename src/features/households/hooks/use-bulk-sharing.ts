import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useHouseholdAction } from '../api/household-queries'
import {
  sharePersonalTransactions,
  type ShareResult,
} from '../api/share-personal-transactions'
import { unsharePersonalTransactions } from '../api/unshare-personal-transactions'

export type SharingOperation = 'share' | 'unshare'

export function useBulkSharing(householdId: string) {
  const [results, setResults] = useState<ShareResult[]>([])
  const [operation, setOperation] = useState<SharingOperation>('share')
  const running = useRef(false)
  const action = useHouseholdAction()
  const run = async (mode: SharingOperation, transactionIds: string[]) => {
    if (running.current || !transactionIds.length) return
    running.current = true
    const ids = [...transactionIds]
    setOperation(mode)
    setResults([])
    let next: ShareResult[] = []
    try {
      await action.run(async () => {
        const update =
          mode === 'share'
            ? sharePersonalTransactions
            : unsharePersonalTransactions
        next = await update(householdId, ids)
        setResults(next)
        const completed = next.filter(
          (r) => r.outcome === (mode === 'share' ? 'shared' : 'unshared'),
        ).length
        const existing = next.filter(
          (r) =>
            r.outcome ===
            (mode === 'share' ? 'already-shared' : 'already-unshared'),
        ).length
        const failed = next.filter((r) => r.outcome === 'failed').length
        const message =
          mode === 'share'
            ? `${completed}件を共有しました。${existing ? ` ${existing}件は共有済みです。` : ''}${failed ? ` ${failed}件を共有できませんでした。` : ''}`
            : `${completed}件の共有を解除しました。${existing ? ` ${existing}件は未共有です。` : ''}${failed ? ` ${failed}件の共有を解除できませんでした。` : ''}個人の取引は残ります。`
        if (failed) toast.error(message)
        else toast.success(message)
      })
      return next
    } catch {
      // useHouseholdAction reports unexpected errors.
    } finally {
      running.current = false
    }
  }
  return {
    share: (ids: string[]) => run('share', ids),
    unshare: (ids: string[]) => run('unshare', ids),
    operation,
    results,
    busy: action.busy,
  }
}
