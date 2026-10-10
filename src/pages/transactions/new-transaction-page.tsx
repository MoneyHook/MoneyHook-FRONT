import {
  TransactionFormSkeleton,
  TransactionFormView,
} from '@/features/transactions'

import { useRecordingScope } from './use-recording-scope'

export function NewTransactionPage() {
  const extension = useRecordingScope()
  if (extension.isInitializing)
    return <TransactionFormSkeleton label="登録先を確認しています" />
  return <TransactionFormView extension={extension} />
}
