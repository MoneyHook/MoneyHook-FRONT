import type {
  V1FixedResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import type { AnalysisRange } from './analysis-overview'

export type FixedSeriesItem = {
  bucket: string
  label: string
  expenseAmount: number
}

export type FixedTransactionItem = {
  id: string
  date: string
  time: string | null
  name: string
  amount: number
  categoryId: string
  categoryName: string
  subcategoryName: string
  paymentName: string | null
}

export type FixedCategoryItem = {
  id: string
  name: string
  amount: number
  ratio: number
  monthlyAverage: number
  annualizedAmount: number
  series: FixedSeriesItem[]
  transactions: FixedTransactionItem[]
}

export type AnalysisFixedViewModel = {
  range: AnalysisRange
  expenseAmount: number
  monthlyAverage: number
  annualizedAmount: number
  totalExpenseRatio: number
  latestBucketAmount: number
  previousBucketAmount: number
  differenceAmount: number
  differenceRate: number | null
  series: FixedSeriesItem[]
  categories: FixedCategoryItem[]
  transactions: FixedTransactionItem[]
}

export type FixedBreakdown = {
  amount: number
  categories: FixedCategoryItem[]
}

function formatSeries(item: { bucket: string; expense_amount: number }) {
  return {
    bucket: item.bucket,
    label: `${Number(item.bucket.slice(5, 7))}月`,
    expenseAmount: item.expense_amount,
  }
}

function compareTransactions(
  left: FixedTransactionItem,
  right: FixedTransactionItem,
) {
  const dateOrder = right.date.localeCompare(left.date)
  if (dateOrder !== 0) {
    return dateOrder
  }

  const timeOrder = (right.time ?? '').localeCompare(left.time ?? '')
  return timeOrder === 0
    ? right.id.localeCompare(left.id, 'ja', { numeric: true })
    : timeOrder
}

function buildTransaction(
  transaction: V1TransactionResource,
): FixedTransactionItem {
  return {
    id: transaction.transaction_id,
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    name: transaction.transaction_name,
    amount: transaction.amount,
    categoryId: transaction.category_id,
    categoryName: transaction.category_name,
    subcategoryName: transaction.sub_category_name,
    paymentName: transaction.payment_name,
  }
}

export function normalizeFixedCategorySelection(
  categories: FixedCategoryItem[],
  rawCategoryIds: string[],
) {
  const requested = new Set(rawCategoryIds)
  const selected = categories
    .filter((category) => requested.has(category.id))
    .map((category) => category.id)

  return selected.length > 0 || categories.length === 0
    ? selected
    : categories.map((category) => category.id)
}

export function buildFixedBreakdown(
  data: AnalysisFixedViewModel,
  selectedCategoryIds: string[],
): FixedBreakdown {
  const selected = new Set(selectedCategoryIds)
  const categories = data.categories.filter((category) => selected.has(category.id))
  const amount = categories.reduce((sum, category) => sum + category.amount, 0)

  return {
    amount,
    categories: categories.map((category) => ({
      ...category,
      ratio: amount === 0 ? 0 : (category.amount / amount) * 100,
    })),
  }
}

export function buildAnalysisFixedViewModel(
  response: V1FixedResponse,
  range: AnalysisRange,
): AnalysisFixedViewModel {
  const categories = [...response.category_list]
    .filter((category) => category.expense_amount > 0)
    .sort((left, right) => {
      if (right.expense_amount === left.expense_amount) {
        return left.category_name.localeCompare(right.category_name, 'ja')
      }
      return right.expense_amount - left.expense_amount
    })
    .map<FixedCategoryItem>((category) => ({
      id: category.category_id,
      name: category.category_name,
      amount: category.expense_amount,
      ratio: category.ratio,
      monthlyAverage: category.monthly_average,
      annualizedAmount: category.annualized_amount,
      series: category.series.map(formatSeries),
      transactions: category.transaction_list
        .map(buildTransaction)
        .sort(compareTransactions),
    }))
  const uniqueTransactions = new Map<string, FixedTransactionItem>()

  categories.forEach((category) => {
    category.transactions.forEach((transaction) => {
      if (!uniqueTransactions.has(transaction.id)) {
        uniqueTransactions.set(transaction.id, transaction)
      }
    })
  })

  return {
    range,
    expenseAmount: response.summary.expense_amount,
    monthlyAverage: response.summary.monthly_average,
    annualizedAmount: response.summary.annualized_amount,
    totalExpenseRatio: response.summary.total_expense_ratio,
    latestBucketAmount: response.summary.latest_bucket_amount,
    previousBucketAmount: response.summary.previous_bucket_amount,
    differenceAmount: response.summary.difference_amount,
    differenceRate: response.summary.difference_rate,
    series: response.series.map(formatSeries),
    categories,
    transactions: [...uniqueTransactions.values()].sort(compareTransactions),
  }
}
