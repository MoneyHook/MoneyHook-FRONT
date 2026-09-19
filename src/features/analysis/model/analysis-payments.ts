import type {
  V1PaymentsResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import type { AnalysisRange } from './analysis-overview'
import { compareAnalysisTransactions } from './analysis-transactions'

export const UNCLASSIFIED_PAYMENT_ID = 'unclassified'

export type PaymentSeriesItem = {
  bucket: string
  label: string
  expenseAmount: number
}

export type PaymentTransactionItem = {
  id: string
  date: string
  time: string | null
  name: string
  amount: number
  categoryName: string
  subcategoryName: string
}

export type PaymentMethodItem = {
  id: string
  name: string
  typeName: string | null
  isPaymentDueLater: boolean | null
  amount: number
  ratio: number
  transactionCount: number
  averageAmount: number
  series: PaymentSeriesItem[]
  transactions: PaymentTransactionItem[]
}

export type AnalysisPaymentsViewModel = {
  range: AnalysisRange
  totalExpenseAmount: number
  payments: PaymentMethodItem[]
}

function formatSeries(item: { bucket: string; expense_amount: number }) {
  return {
    bucket: item.bucket,
    label: `${Number(item.bucket.slice(5, 7))}月`,
    expenseAmount: item.expense_amount,
  }
}

function buildTransaction(
  transaction: V1TransactionResource,
): PaymentTransactionItem {
  return {
    id: transaction.transaction_id,
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    name: transaction.transaction_name,
    amount: transaction.amount,
    categoryName: transaction.category_name,
    subcategoryName: transaction.sub_category_name,
  }
}

export function getSelectedPayment(
  payments: PaymentMethodItem[],
  paymentId: string | null,
) {
  if (!paymentId) {
    return null
  }
  return payments.find((payment) => payment.id === paymentId) ?? null
}

export function buildAnalysisPaymentsViewModel(
  response: V1PaymentsResponse,
  range: AnalysisRange,
): AnalysisPaymentsViewModel {
  const payments = response.payment_list
    .map<PaymentMethodItem>((payment) => ({
      id: payment.payment_id ?? UNCLASSIFIED_PAYMENT_ID,
      name: payment.payment_name,
      typeName: payment.payment_type_name,
      isPaymentDueLater: payment.is_payment_due_later,
      amount: payment.expense_amount,
      ratio: payment.ratio,
      transactionCount: payment.transaction_count,
      averageAmount: payment.average_amount,
      series: payment.series.map(formatSeries),
      transactions: payment.transaction_list
        .map(buildTransaction)
        .sort(compareAnalysisTransactions),
    }))
    .sort((left, right) => {
      if (right.amount === left.amount) {
        return left.name.localeCompare(right.name, 'ja')
      }
      return right.amount - left.amount
    })

  return {
    range,
    totalExpenseAmount: response.total_expense_amount,
    payments,
  }
}
