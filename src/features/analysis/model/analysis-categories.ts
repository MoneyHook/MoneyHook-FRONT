import type {
  V1CategoriesResponse,
  V1TransactionResource,
} from '@/shared/api/generated/model'

import type { AnalysisRange } from './analysis-overview'

export type CategoryMetric = 'amount' | 'ratio'
export type CategoryGroup = 'day' | 'week' | 'month'
export type CategoryListMode = 'top' | 'all'

export type CategorySeriesItem = {
  bucket: string
  label: string
  expenseAmount: number
}

export type CategoryTransactionItem = {
  id: string
  date: string
  time: string | null
  name: string
  amount: number
  subcategoryName: string
  paymentName: string | null
}

export type SubcategoryAnalysisItem = {
  id: string
  name: string
  amount: number
  ratio: number
}

export type CategoryAnalysisItem = {
  id: string
  name: string
  amount: number
  ratio: number
  series: CategorySeriesItem[]
  subcategories: SubcategoryAnalysisItem[]
  transactions: CategoryTransactionItem[]
}

export type CategorySummaryItem = {
  id: string
  name: string
  amount: number
  ratio: number
  selectable: boolean
}

export type AnalysisCategoriesViewModel = {
  range: AnalysisRange
  totalExpenseAmount: number
  categories: CategoryAnalysisItem[]
  topCategories: CategorySummaryItem[]
}

export type CategoryUrlState = {
  metric: CategoryMetric
  group: CategoryGroup
  listMode: CategoryListMode
}

function ratio(amount: number, total: number) {
  return total === 0 ? 0 : (amount / total) * 100
}

function formatSeriesLabel(bucket: string, group: CategoryGroup) {
  const month = Number(bucket.slice(5, 7))
  const day = Number(bucket.slice(8, 10))
  if (group === 'month') {
    return `${month}月`
  }
  if (group === 'week') {
    return `${month}/${day}週`
  }
  return `${month}/${day}`
}

function compareTransactions(
  left: CategoryTransactionItem,
  right: CategoryTransactionItem,
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
): CategoryTransactionItem {
  return {
    id: transaction.transaction_id,
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    name: transaction.transaction_name,
    amount: transaction.amount,
    subcategoryName: transaction.sub_category_name,
    paymentName: transaction.payment_name,
  }
}

export function normalizeCategoryMetric(value: string | null): CategoryMetric {
  return value === 'ratio' ? 'ratio' : 'amount'
}

export function normalizeCategoryGroup(value: string | null): CategoryGroup {
  return value === 'day' || value === 'week' ? value : 'month'
}

export function normalizeCategoryListMode(
  value: string | null,
): CategoryListMode {
  return value === 'all' ? 'all' : 'top'
}

export function normalizeCategoryUrlState({
  metric,
  group,
  listMode,
}: {
  metric: string | null
  group: string | null
  listMode: string | null
}): CategoryUrlState {
  return {
    metric: normalizeCategoryMetric(metric),
    group: normalizeCategoryGroup(group),
    listMode: normalizeCategoryListMode(listMode),
  }
}

export function buildAnalysisCategoriesViewModel(
  response: V1CategoriesResponse,
  range: AnalysisRange,
  group: CategoryGroup,
): AnalysisCategoriesViewModel {
  const categories = [...response.category_list]
    .filter((category) => category.expense_amount > 0)
    .sort((left, right) => {
      if (right.expense_amount === left.expense_amount) {
        return left.category_name.localeCompare(right.category_name, 'ja')
      }
      return right.expense_amount - left.expense_amount
    })
    .map<CategoryAnalysisItem>((category) => ({
      id: category.category_id,
      name: category.category_name,
      amount: category.expense_amount,
      ratio: ratio(category.expense_amount, response.total_expense_amount),
      series: category.series.map((item) => ({
        bucket: item.bucket,
        label: formatSeriesLabel(item.bucket, group),
        expenseAmount: item.expense_amount,
      })),
      subcategories: [...category.sub_category_list]
        .filter((subcategory) => subcategory.expense_amount > 0)
        .sort((left, right) => {
          if (right.expense_amount === left.expense_amount) {
            return left.sub_category_name.localeCompare(
              right.sub_category_name,
              'ja',
            )
          }
          return right.expense_amount - left.expense_amount
        })
        .map((subcategory) => ({
          id: subcategory.sub_category_id,
          name: subcategory.sub_category_name,
          amount: subcategory.expense_amount,
          ratio: ratio(subcategory.expense_amount, category.expense_amount),
        })),
      transactions: category.transaction_list
        .map(buildTransaction)
        .sort(compareTransactions),
    }))

  const leading = categories.slice(0, 5).map<CategorySummaryItem>((category) => ({
    id: category.id,
    name: category.name,
    amount: category.amount,
    ratio: category.ratio,
    selectable: true,
  }))
  const remainingAmount = categories
    .slice(5)
    .reduce((sum, category) => sum + category.amount, 0)
  const topCategories =
    remainingAmount > 0
      ? [
          ...leading,
          {
            id: '__other__',
            name: 'その他',
            amount: remainingAmount,
            ratio: ratio(remainingAmount, response.total_expense_amount),
            selectable: false,
          },
        ]
      : leading

  return {
    range,
    totalExpenseAmount: response.total_expense_amount,
    categories,
    topCategories,
  }
}

export function getSelectedCategory(
  data: AnalysisCategoriesViewModel,
  categoryId: string | null,
) {
  return (
    data.categories.find((category) => category.id === categoryId) ??
    data.categories[0] ??
    null
  )
}

