import type {
  HomeResponse,
  V1FixedResponse,
  V1OverviewResponse,
} from '@/shared/api/generated/model'

export type MonthContext = {
  month: string
  monthInput: string
  monthLabel: string
  currentMonthInput: string
  startDate: string
  endDate: string
  previousMonth: string
  previousStartDate: string
  previousEndDate: string
  daysInMonth: number
  elapsedDays: number
  remainingDays: number
  isCurrentMonth: boolean
}

export type PacePoint = {
  day: number
  label: string
  current: number | null
  previous: number
}

export type CategorySummary = {
  name: string
  amount: number
  difference: number
  ratio: number
  barRatio: number
}

export type CategoryChange = {
  name: string
  difference: number
  previousAmount: number
}

export type HomeDashboardViewModel = {
  expenseAmount: number
  differenceAmount: number
  differenceRate: number | null
  fixedExpenseAmount: number
  variableExpenseAmount: number
  fixedExpenseRatio: number
  variableExpenseRatio: number
  dailyAverage: number
  dayCaption: string
  pace: PacePoint[]
  categories: CategorySummary[]
  increase: CategoryChange | null
  decrease: CategoryChange | null
  fixedMonthlyAmount: number
  fixedAnnualizedAmount: number
  fixedTotalExpenseRatio: number
}

type DashboardResponses = {
  currentOverview: V1OverviewResponse
  previousOverview: V1OverviewResponse
  currentHome: HomeResponse
  previousHome: HomeResponse
  fixed: V1FixedResponse
  month: MonthContext
}

function formatDate(year: number, monthIndex: number, day: number) {
  return [year, String(monthIndex + 1).padStart(2, '0'), String(day).padStart(2, '0')].join(
    '-',
  )
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function monthInputFromDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

export function normalizeMonthParam(value: string | null, now = new Date()) {
  const currentMonthInput = monthInputFromDate(now)
  if (!value?.match(/^\d{4}-(0[1-9]|1[0-2])-01$/)) {
    return `${currentMonthInput}-01`
  }

  return value.slice(0, 7) > currentMonthInput ? `${currentMonthInput}-01` : value
}

export function createMonthContext(value: string | null, now = new Date()): MonthContext {
  const month = normalizeMonthParam(value, now)
  const year = Number(month.slice(0, 4))
  const monthIndex = Number(month.slice(5, 7)) - 1
  const selectedDays = daysInMonth(year, monthIndex)
  const currentMonthInput = monthInputFromDate(now)
  const isCurrentMonth = month.slice(0, 7) === currentMonthInput
  const elapsedDays = isCurrentMonth ? Math.min(now.getDate(), selectedDays) : selectedDays
  const previousDate = new Date(year, monthIndex - 1, 1)
  const previousDays = daysInMonth(previousDate.getFullYear(), previousDate.getMonth())

  return {
    month,
    monthInput: month.slice(0, 7),
    monthLabel: `${year}年${monthIndex + 1}月`,
    currentMonthInput,
    startDate: formatDate(year, monthIndex, 1),
    endDate: formatDate(year, monthIndex, selectedDays),
    previousMonth: formatDate(previousDate.getFullYear(), previousDate.getMonth(), 1),
    previousStartDate: formatDate(previousDate.getFullYear(), previousDate.getMonth(), 1),
    previousEndDate: formatDate(
      previousDate.getFullYear(),
      previousDate.getMonth(),
      previousDays,
    ),
    daysInMonth: selectedDays,
    elapsedDays,
    remainingDays: isCurrentMonth ? Math.max(selectedDays - elapsedDays, 0) : 0,
    isCurrentMonth,
  }
}

function cumulativeSeries(
  series: V1OverviewResponse['series'],
  visibleThrough: number,
) {
  const amounts = new Map(
    series.map((item) => [Number(item.bucket.slice(8, 10)), item.expense_amount]),
  )
  const cumulative = new Map<number, number>()
  let total = 0

  for (let day = 1; day <= visibleThrough; day += 1) {
    total += amounts.get(day) ?? 0
    cumulative.set(day, total)
  }

  return cumulative
}

function categoryAmounts(home: HomeResponse) {
  return new Map(
    home.category_list.map((category) => [
      category.category_name,
      Math.abs(category.category_total_amount),
    ]),
  )
}

function ratio(amount: number, total: number) {
  return total === 0 ? 0 : (amount / total) * 100
}

export function buildHomeDashboardViewModel({
  currentOverview,
  previousOverview,
  currentHome,
  previousHome,
  fixed,
  month,
}: DashboardResponses): HomeDashboardViewModel {
  const expenseAmount = currentOverview.summary.expense_amount
  const previousExpenseAmount = previousOverview.summary.expense_amount
  const differenceAmount = expenseAmount - previousExpenseAmount
  const differenceRate =
    previousExpenseAmount === 0 ? null : (differenceAmount / previousExpenseAmount) * 100

  const currentSeries = cumulativeSeries(currentOverview.series, month.elapsedDays)
  const previousDays = Number(month.previousEndDate.slice(8, 10))
  const previousSeries = cumulativeSeries(previousOverview.series, previousDays)
  const pace = Array.from(
    { length: Math.max(month.daysInMonth, previousDays) },
    (_, index) => {
      const day = index + 1
      return {
        day,
        label: `${day}日`,
        current: day <= month.elapsedDays ? (currentSeries.get(day) ?? 0) : null,
        previous: previousSeries.get(day) ?? previousSeries.get(previousDays) ?? 0,
      }
    },
  )

  const currentCategories = categoryAmounts(currentHome)
  const previousCategories = categoryAmounts(previousHome)
  const sortedCategories = [...currentCategories.entries()].sort((left, right) => {
    if (right[1] === left[1]) {
      return left[0].localeCompare(right[0], 'ja')
    }
    return right[1] - left[1]
  })
  const maxCategoryAmount = sortedCategories[0]?.[1] ?? 0
  const categories = sortedCategories.slice(0, 5).map(([name, amount]) => ({
    name,
    amount,
    difference: amount - (previousCategories.get(name) ?? 0),
    ratio: ratio(amount, expenseAmount),
    barRatio: ratio(amount, maxCategoryAmount),
  }))

  const categoryNames = new Set([...currentCategories.keys(), ...previousCategories.keys()])
  const changes = [...categoryNames].map((name) => ({
    name,
    difference: (currentCategories.get(name) ?? 0) - (previousCategories.get(name) ?? 0),
    previousAmount: previousCategories.get(name) ?? 0,
  }))
  const increase =
    changes
      .filter((change) => change.difference > 0)
      .sort((left, right) => right.difference - left.difference)[0] ?? null
  const decrease =
    changes
      .filter((change) => change.difference < 0)
      .sort((left, right) => left.difference - right.difference)[0] ?? null

  const fixedExpenseAmount = currentOverview.summary.fixed_expense_amount
  const variableExpenseAmount = currentOverview.summary.variable_expense_amount

  return {
    expenseAmount,
    differenceAmount,
    differenceRate,
    fixedExpenseAmount,
    variableExpenseAmount,
    fixedExpenseRatio: ratio(fixedExpenseAmount, expenseAmount),
    variableExpenseRatio: ratio(variableExpenseAmount, expenseAmount),
    dailyAverage: month.elapsedDays === 0 ? 0 : Math.round(expenseAmount / month.elapsedDays),
    dayCaption: month.isCurrentMonth
      ? `残り${month.remainingDays}日`
      : `${month.daysInMonth}日間`,
    pace,
    categories,
    increase,
    decrease,
    fixedMonthlyAmount: fixed.summary.expense_amount,
    fixedAnnualizedAmount: fixed.summary.annualized_amount,
    fixedTotalExpenseRatio: fixed.summary.total_expense_ratio,
  }
}

export function formatCurrency(value: number) {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`
}

export function formatSignedCurrency(value: number) {
  if (value === 0) {
    return '±¥0'
  }
  return `${value > 0 ? '+' : '-'}¥${Math.abs(Math.round(value)).toLocaleString('ja-JP')}`
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
