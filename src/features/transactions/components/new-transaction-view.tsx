import { TransactionFormView } from './transaction-form-view'

export { TransactionFormView } from './transaction-form-view'

export function NewTransactionView() {
  return <TransactionFormView />
}

export function EditTransactionView({
  transactionId,
}: {
  transactionId: string
}) {
  return <TransactionFormView transactionId={transactionId} />
}
