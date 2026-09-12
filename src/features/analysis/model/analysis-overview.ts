import type {
  V1CategoriesResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'

export type AnalysisRange = {
  startDate: string
  endDate: string
  label: string
}

export type AnalysisRangeSelection = {
  range: AnalysisRange
  startMonth: string
  endMonth: string
  isDefault: boolean
}

export type AnalysisBreakdownItem = {
  name: string
  amount: number
  ratio: number
}

export type AnalysisChangeItem = {
  name: string
  amount: number
  rate: number | null
  barRatio: number
}

export type AnalysisSeriesItem = {
  bucket: string
  label: string
  expenseAmount: number
}

export type AnalysisOverviewViewModel = {
  range: AnalysisRange
  expenseAmount: number
  monthlyAverageExpense: number
  fixedExpenseAmount: number
  variableExpenseAmount: number
  fixedExpenseRatio: number
  variableExpenseRatio: number
  series: AnalysisSeriesItem[]
  categories: AnalysisBreakdownItem[]
  fixedCategories: AnalysisBreakdownItem[]
  increases: AnalysisChangeItem[]
  decreases: AnalysisChangeItem[]
  comparisonAmount: number
  differenceAmount: number
  differenceRate: number | null
  latestFixedDifferenceAmount: number
  latestFixedDifferenceRate: number | null
}

type OverviewResponses = {
  overview: V1OverviewResponse
  categories: V1CategoriesResponse
  fixed: V1FixedResponse
  range: AnalysisRange
}

function formatDate(year: number, monthIndex: number, day: number) {
  return [
    year,
    String(monthIndex + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function formatJapaneseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

export function formatJapaneseMonth(value: string) {
  const [year, month] = value.split('-').map(Number)
  return `${year}年${month}月`
}

function isMonth(value: string | null): value is string {
  return value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

function ratio(amount: number, total: number) {
  return total === 0 ? 0 : (amount / total) * 100
}

export function createAnalysisRangeFromMonths(
  startMonth: string,
  endMonth: string,
): AnalysisRange {
  const [startYear, startMonthIndex] = startMonth.split('-').map(Number)
  const [endYear, endMonthIndex] = endMonth.split('-').map(Number)
  const startDate = formatDate(startYear, startMonthIndex - 1, 1)
  const endDay = new Date(endYear, endMonthIndex, 0).getDate()
  const endDate = formatDate(endYear, endMonthIndex - 1, endDay)

  return {
    startDate,
    endDate,
    label: `${formatJapaneseDate(startDate)} 〜 ${formatJapaneseDate(endDate)}`,
  }
}

export function createAnalysisRange(now = new Date()): AnalysisRange {
  return resolveAnalysisRange({ now }).range
}

export function getCurrentAnalysisMonth(now = new Date()) {
  return formatDate(now.getFullYear(), now.getMonth(), 1).slice(0, 7)
}

export function resolveAnalysisRange({
  startMonth,
  endMonth,
  now = new Date(),
}: {
  startMonth?: string | null
  endMonth?: string | null
  now?: Date
}): AnalysisRangeSelection {
  const currentMonth = getCurrentAnalysisMonth(now)
  const defaultEndMonth = currentMonth
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const defaultStartMonth = formatDate(
    defaultStartDate.getFullYear(),
    defaultStartDate.getMonth(),
    1,
  ).slice(0, 7)
  const requestedStartMonth = startMonth ?? null
  const requestedEndMonth = endMonth ?? null
  const hasValidSelection =
    isMonth(requestedStartMonth) &&
    isMonth(requestedEndMonth) &&
    requestedStartMonth <= requestedEndMonth &&
    requestedEndMonth <= currentMonth
  const resolvedStartMonth = hasValidSelection
    ? requestedStartMonth
    : defaultStartMonth
  const resolvedEndMonth = hasValidSelection
    ? requestedEndMonth
    : defaultEndMonth

  return {
    range: createAnalysisRangeFromMonths(resolvedStartMonth, resolvedEndMonth),
    startMonth: resolvedStartMonth,
    endMonth: resolvedEndMonth,
    isDefault: !hasValidSelection,
  }
}

function buildBreakdown(
  items: Array<{ name: string; amount: number }>,
  total: number,
): AnalysisBreakdownItem[] {
  const sorted = [...items]
    .filter((item) => item.amount > 0)
    .sort((left, right) => {
      if (right.amount === left.amount) {
        return left.name.localeCompare(right.name, 'ja')
      }
      return right.amount - left.amount
    })
  const leading = sorted.slice(0, 4)
  const remainingAmount = sorted
    .slice(4)
    .reduce((sum, item) => sum + item.amount, 0)
  const result =
    remainingAmount > 0
      ? [...leading, { name: 'その他', amount: remainingAmount }]
      : leading

  return result.map((item) => ({
    ...item,
    ratio: ratio(item.amount, total),
  }))
}

function buildChanges(
  changes: V1OverviewResponse['category_changes'],
  direction: 'increase' | 'decrease',
): AnalysisChangeItem[] {
  const selected = changes
    .filter((change) =>
      direction === 'increase'
        ? change.difference_amount > 0
        : change.difference_amount < 0,
    )
    .sort((left, right) =>
      direction === 'increase'
        ? right.difference_amount - left.difference_amount
        : left.difference_amount - right.difference_amount,
    )
    .slice(0, 3)
  const maximum = Math.max(
    ...selected.map((change) => Math.abs(change.difference_amount)),
    0,
  )

  return selected.map((change) => ({
    name: change.category_name,
    amount: change.difference_amount,
    rate: change.difference_rate,
    barRatio: ratio(Math.abs(change.difference_amount), maximum),
  }))
}

export function buildAnalysisOverviewViewModel({
  overview,
  categories,
  fixed,
  range,
}: OverviewResponses): AnalysisOverviewViewModel {
  const expenseAmount = overview.summary.expense_amount
  const comparisonAmount = overview.category_changes.reduce(
    (sum, change) => sum + change.comparison_amount,
    0,
  )
  const differenceAmount = expenseAmount - comparisonAmount

  return {
    range,
    expenseAmount,
    monthlyAverageExpense: overview.summary.monthly_average_expense,
    fixedExpenseAmount: overview.summary.fixed_expense_amount,
    variableExpenseAmount: overview.summary.variable_expense_amount,
    fixedExpenseRatio: ratio(
      overview.summary.fixed_expense_amount,
      expenseAmount,
    ),
    variableExpenseRatio: ratio(
      overview.summary.variable_expense_amount,
      expenseAmount,
    ),
    series: overview.series.map((item) => ({
      bucket: item.bucket,
      label: `${Number(item.bucket.slice(5, 7))}月`,
      expenseAmount: item.expense_amount,
    })),
    categories: buildBreakdown(
      categories.category_list.map((category) => ({
        name: category.category_name,
        amount: category.expense_amount,
      })),
      categories.total_expense_amount,
    ),
    fixedCategories: buildBreakdown(
      fixed.category_list.map((category) => ({
        name: category.category_name,
        amount: category.expense_amount,
      })),
      fixed.summary.expense_amount,
    ),
    increases: buildChanges(overview.category_changes, 'increase'),
    decreases: buildChanges(overview.category_changes, 'decrease'),
    comparisonAmount,
    differenceAmount,
    differenceRate:
      comparisonAmount === 0
        ? null
        : (differenceAmount / comparisonAmount) * 100,
    latestFixedDifferenceAmount: fixed.summary.difference_amount,
    latestFixedDifferenceRate: fixed.summary.difference_rate,
  }
}

export function formatCurrency(value: number) {
  return `¥${Math.abs(Math.round(value)).toLocaleString('ja-JP')}`
}

export function formatSignedCurrency(value: number) {
  if (value === 0) {
    return '±¥0'
  }
  return `${value > 0 ? '+' : '-'}${formatCurrency(value)}`
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
