import { useParams } from 'react-router-dom'

import { EditTransactionView } from '@/features/transactions'
import { NotFoundState } from '@/shared/components/app-state'

export function EditTransactionPage() {
  const { transactionId } = useParams()

  if (!transactionId) {
    return <NotFoundState withinApp />
  }

  return <EditTransactionView transactionId={transactionId} />
}
