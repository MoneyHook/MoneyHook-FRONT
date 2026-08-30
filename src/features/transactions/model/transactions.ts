import type { TimelineTransaction } from '@/shared/api/generated/model'

export type TransactionView = 'list' | 'calendar'

export type TransactionItem = {
  id: string
  name: string
  amount: number
  sign: -1 | 1
  date: string
  categoryId: string
  categoryName: string
  subcategoryName: string
  fixed: boolean
  paymentName: string | null
}

export type TransactionDayGroup = {
  date: string
  items: TransactionItem[]
  expenseAmount: number
  incomeAmount: number
}

export type TransactionCategoryTotal = {
  name: string
  amount: number
}

export type TransactionsViewModel = {
  items: TransactionItem[]
  groups: TransactionDayGroup[]
  expenseAmount: number
  incomeAmount: number
  balanceAmount: number
}

export type TransactionMonth = {
  month: string
  monthInput: string
  monthLabel: string
  currentMonthInput: string
  previousMonth: string
  nextMonth: string
  canGoNext: boolean
  year: number
  monthIndex: number
  daysInMonth: number
}

export type CalendarDay = {
  date: string
  day: number
  isCurrentMonth: boolean
}

function formatDate(year: number, monthIndex: number, day: number) {
  return [
    year,
    String(monthIndex + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function monthInputFromDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function startOfMonth(value: Date) {
  return formatDate(value.getFullYear(), value.getMonth(), 1)
}

export function normalizeMonthParam(value: string | null, now = new Date()) {
  const currentMonthInput = monthInputFromDate(now)
  if (!value?.match(/^\d{4}-(0[1-9]|1[0-2])-01$/)) {
    return `${currentMonthInput}-01`
  }

  return value.slice(0, 7) > currentMonthInput ? `${currentMonthInput}-01` : value
}

export function createTransactionMonth(
  value: string | null,
  now = new Date(),
): TransactionMonth {
  const month = normalizeMonthParam(value, now)
  const year = Number(month.slice(0, 4))
  const monthIndex = Number(month.slice(5, 7)) - 1
  const currentMonthInput = monthInputFromDate(now)
  const previous = new Date(year, monthIndex - 1, 1)
  const next = new Date(year, monthIndex + 1, 1)

  return {
    month,
    monthInput: month.slice(0, 7),
    monthLabel: `${year}年${monthIndex + 1}月`,
    currentMonthInput,
    previousMonth: startOfMonth(previous),
    nextMonth: startOfMonth(next),
    canGoNext: month.slice(0, 7) < currentMonthInput,
    year,
    monthIndex,
    daysInMonth: new Date(year, monthIndex + 1, 0).getDate(),
  }
}

export function normalizeTransactionView(value: string | null): TransactionView {
  return value === 'calendar' ? 'calendar' : 'list'
}

export function buildTransactionsViewModel(
  transactions: TimelineTransaction[],
): TransactionsViewModel {
  const items = transactions
    .map<TransactionItem>((transaction) => ({
      id: transaction.transaction_id,
      name: transaction.transaction_name,
      amount: transaction.transaction_amount,
      sign: transaction.transaction_sign,
      date: transaction.transaction_date,
      categoryId: transaction.category_id,
      categoryName: transaction.category_name,
      subcategoryName: transaction.sub_category_name,
      fixed: transaction.fixed_flg,
      paymentName: transaction.payment_name,
    }))
    .sort((left, right) => {
      const dateOrder = right.date.localeCompare(left.date)
      return dateOrder === 0 ? right.id.localeCompare(left.id, 'ja', { numeric: true }) : dateOrder
    })

  const expenseAmount = items.reduce(
    (total, item) => total + (item.sign === -1 ? item.amount : 0),
    0,
  )
  const incomeAmount = items.reduce(
    (total, item) => total + (item.sign === 1 ? item.amount : 0),
    0,
  )
  const byDate = new Map<string, TransactionItem[]>()

  items.forEach((item) => {
    byDate.set(item.date, [...(byDate.get(item.date) ?? []), item])
  })

  const groups = [...byDate.entries()].map(([date, dayItems]) => ({
    date,
    items: dayItems,
    expenseAmount: dayItems.reduce(
      (total, item) => total + (item.sign === -1 ? item.amount : 0),
      0,
    ),
    incomeAmount: dayItems.reduce(
      (total, item) => total + (item.sign === 1 ? item.amount : 0),
      0,
    ),
  }))

  return {
    items,
    groups,
    expenseAmount,
    incomeAmount,
    balanceAmount: incomeAmount - expenseAmount,
  }
}

export function getDefaultSelectedDate(
  month: TransactionMonth,
  items: TransactionItem[],
  now = new Date(),
) {
  if (month.monthInput === monthInputFromDate(now)) {
    return formatDate(month.year, month.monthIndex, now.getDate())
  }

  return (
    items.find((item) => item.date.startsWith(month.monthInput))?.date ??
    formatDate(month.year, month.monthIndex, month.daysInMonth)
  )
}

export function normalizeSelectedDate(
  value: string | null,
  month: TransactionMonth,
  items: TransactionItem[],
  now = new Date(),
) {
  if (value?.match(/^\d{4}-\d{2}-\d{2}$/) && value.startsWith(month.monthInput)) {
    const day = Number(value.slice(8, 10))
    if (day >= 1 && day <= month.daysInMonth) {
      return value
    }
  }

  return getDefaultSelectedDate(month, items, now)
}

export function buildCalendarDays(month: TransactionMonth): CalendarDay[] {
  const firstWeekday = new Date(month.year, month.monthIndex, 1).getDay()
  const visibleDays = Math.ceil((firstWeekday + month.daysInMonth) / 7) * 7

  return Array.from({ length: visibleDays }, (_, index) => {
    const value = new Date(month.year, month.monthIndex, index - firstWeekday + 1)
    return {
      date: formatDate(value.getFullYear(), value.getMonth(), value.getDate()),
      day: value.getDate(),
      isCurrentMonth: value.getMonth() === month.monthIndex,
    }
  })
}

export function getCategoryTotals(items: TransactionItem[]) {
  const totals = new Map<string, number>()

  items.forEach((item) => {
    if (item.sign === -1) {
      totals.set(item.categoryName, (totals.get(item.categoryName) ?? 0) + item.amount)
    }
  })

  return [...totals.entries()]
    .map<TransactionCategoryTotal>(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name, 'ja'))
}

export function formatCurrency(value: number) {
  return `¥${Math.abs(Math.round(value)).toLocaleString('ja-JP')}`
}

export function formatBalance(value: number) {
  if (value === 0) {
    return '¥0'
  }
  return `${value < 0 ? '-' : '+'}${formatCurrency(value)}`
}

export function formatJapaneseDate(value: string, includeYear = false) {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]

  return `${includeYear ? `${year}年` : ''}${month}月${day}日（${weekday}）`
}
