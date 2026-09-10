import { useQueryClient } from '@tanstack/react-query'

import { CsvImportView } from '@/features/csv-import'
import { invalidateTransactionQueries } from '@/features/transactions'

export function CsvImportPage() {
  const queryClient = useQueryClient()
  return <CsvImportView onImported={() => invalidateTransactionQueries(queryClient)} />
}
