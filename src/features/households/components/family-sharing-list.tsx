import type { RowSelectionState } from '@tanstack/react-table'
import { LoaderCircle } from 'lucide-react'

import type { V1TransactionResource } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'

import type { ShareResult } from '../api/share-personal-transactions'
import type { SharingOperation } from '../hooks/use-bulk-sharing'
import { useSharingTable } from '../hooks/use-sharing-table'
import { FamilySharingCard } from './family-sharing-card'

export function FamilySharingList({
  transactions,
  busy,
  operation,
  results,
  onShare,
  onUnshare,
}: {
  transactions: V1TransactionResource[]
  busy: boolean
  operation: SharingOperation
  results: ShareResult[]
  onShare: (ids: string[]) => Promise<ShareResult[] | undefined>
  onUnshare: (ids: string[]) => Promise<ShareResult[] | undefined>
}) {
  const table = useSharingTable(transactions)
  const rows = table.getRowModel().rows
  const selectedRows = table.getSelectedRowModel().rows
  const failures = new Map(
    results
      .filter((result) => result.outcome === 'failed')
      .map((result) => [result.transactionId, result.message]),
  )
  const run = async (update: typeof onShare) => {
    const next = await update(selectedRows.map((row) => row.id))
    if (!next) return
    const failedSelection: RowSelectionState = {}
    const failedIds = new Set(
      next
        .filter((result) => result.outcome === 'failed')
        .map((result) => result.transactionId),
    )
    for (const row of table.getRowModel().rows) {
      if (failedIds.has(row.id)) failedSelection[row.id] = true
    }
    table.setRowSelection(failedSelection)
  }

  return (
    <fieldset aria-label="共有する取引" disabled={busy} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              className="rounded-[2px]"
              checked={
                table.getIsAllRowsSelected() ||
                (table.getIsSomeRowsSelected() ? 'indeterminate' : false)
              }
              disabled={busy || !rows.length}
              onCheckedChange={(checked) =>
                table.toggleAllRowsSelected(checked === true)
              }
            />
            全選択
          </label>
          {!busy && (
            <span role="status" className="text-xs text-muted-foreground">
              {selectedRows.length}件を選択中
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy || !selectedRows.length}
            aria-busy={busy && operation === 'unshare'}
            onClick={() => void run(onUnshare)}
          >
            {busy && operation === 'unshare' && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            共有解除
          </Button>
          <Button
            disabled={busy || !selectedRows.length}
            aria-busy={busy && operation === 'share'}
            onClick={() => void run(onShare)}
          >
            {busy && operation === 'share' && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            共有
          </Button>
        </div>
      </div>
      {failures.size > 0 && (
        <p className="text-sm">
          {operation === 'share'
            ? '共有できなかった取引を確認し、再度共有してください。'
            : '共有を解除できなかった取引を確認し、再度共有解除してください。'}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <FamilySharingCard
              transaction={row.original}
              checked={row.getIsSelected()}
              busy={busy}
              error={failures.get(row.id)}
              onSelect={(checked) => row.toggleSelected(checked)}
            />
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
