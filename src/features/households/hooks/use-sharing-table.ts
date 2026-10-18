import {
  type ColumnDef,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { useEffect } from 'react'

import type { V1TransactionResource } from '@/shared/api/generated/model'

const features = tableFeatures({ rowSelectionFeature })
const columns: ColumnDef<typeof features, V1TransactionResource>[] = [
  { accessorKey: 'transaction_name' },
]

export function useSharingTable(transactions: V1TransactionResource[]) {
  const table = useTable({
    features,
    columns,
    data: transactions,
    getRowId: (transaction) => transaction.transaction_id,
    enableRowSelection: true,
  })
  const { setRowSelection } = table

  useEffect(() => {
    const visibleIds = new Set(transactions.map((t) => t.transaction_id))
    setRowSelection((current) => {
      const entries = Object.entries(current)
      const remaining = entries.filter(([id]) => visibleIds.has(id))
      return remaining.length === entries.length
        ? current
        : Object.fromEntries(remaining)
    })
  }, [transactions, setRowSelection])

  return table
}
