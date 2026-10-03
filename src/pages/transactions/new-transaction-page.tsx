import { TransactionFormView } from '@/features/transactions'

import { useRecordingScope } from './use-recording-scope'

export function NewTransactionPage() {
  const extension = useRecordingScope()
  if (extension.isInitializing)
    return (
      <p role="status" className="p-6">
        登録先を確認しています…
      </p>
    )
  return <TransactionFormView extension={extension} />
}
