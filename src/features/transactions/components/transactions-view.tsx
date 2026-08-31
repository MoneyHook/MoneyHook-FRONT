import {
  CalendarDays,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coffee,
  Funnel,
  House,
  Lightbulb,
  Plus,
  Search,
  ShoppingCart,
  Tags,
  Ticket,
  TrainFront,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ErrorState } from '@/shared/components/app-state'
import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import { useTransactions } from '../api/use-transactions'
import {
  buildCalendarDays,
  createTransactionMonth,
  formatBalance,
  formatCurrency,
  formatJapaneseDate,
  getCategoryTotals,
  normalizeMonthParam,
  normalizeSelectedDate,
  normalizeTransactionView,
  type TransactionDayGroup,
  type TransactionItem,
  type TransactionMonth,
  type TransactionsViewModel,
  type TransactionView,
} from '../model/transactions'

type CategoryPresentation = {
  icon: LucideIcon
  iconClassName: string
  dotClassName: string
}

const defaultCategoryPresentation: CategoryPresentation = {
  icon: Tags,
  iconClassName: 'bg-muted text-muted-foreground',
  dotClassName: 'bg-muted-foreground',
}

const categoryPresentations: Record<string, CategoryPresentation> = {
  食費: {
    icon: Utensils,
    iconClassName: 'bg-warning/12 text-warning',
    dotClassName: 'bg-warning',
  },
  日用品: {
    icon: ShoppingCart,
    iconClassName: 'bg-success/12 text-success',
    dotClassName: 'bg-success',
  },
  交通: {
    icon: TrainFront,
    iconClassName: 'bg-chart-2/12 text-chart-2',
    dotClassName: 'bg-chart-2',
  },
  住居: {
    icon: House,
    iconClassName: 'bg-chart-2/12 text-chart-2',
    dotClassName: 'bg-chart-2',
  },
  固定費: {
    icon: Lightbulb,
    iconClassName: 'bg-warning/12 text-warning',
    dotClassName: 'bg-warning',
  },
  娯楽: {
    icon: Ticket,
    iconClassName: 'bg-chart-4/12 text-chart-4',
    dotClassName: 'bg-chart-4',
  },
  その他: {
    icon: Coffee,
    iconClassName: 'bg-chart-5/12 text-chart-5',
    dotClassName: 'bg-chart-5',
  },
  収入: {
    icon: CircleDollarSign,
    iconClassName: 'bg-income/12 text-income',
    dotClassName: 'bg-income',
  },
}

function getCategoryPresentation(item: Pick<TransactionItem, 'categoryName' | 'sign'>) {
  if (item.sign === 1) {
    return categoryPresentations.収入
  }
  return categoryPresentations[item.categoryName] ?? defaultCategoryPresentation
}

function getPresentationByName(name: string) {
  return categoryPresentations[name] ?? defaultCategoryPresentation
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Button
        aria-label="取引を検索（準備中）"
        disabled
        size="icon-lg"
        title="検索は準備中です"
        variant="ghost"
      >
        <Search aria-hidden="true" className="size-5" />
      </Button>
      <Button
        aria-label="取引を絞り込み（準備中）"
        disabled
        size="icon-lg"
        title="絞り込みは準備中です"
        variant="ghost"
      >
        <Funnel aria-hidden="true" className="size-5" />
      </Button>
    </div>
  )
}

function ViewTabs({
  value,
  onChange,
}: {
  value: TransactionView
  onChange: (value: TransactionView) => void
}) {
  const tabs = [
    { value: 'list', label: '一覧' },
    { value: 'calendar', label: 'カレンダー' },
  ] as const

  return (
    <div aria-label="取引の表示形式" className="grid grid-cols-2 border-b" role="tablist">
      {tabs.map((tab) => {
        const isSelected = value === tab.value
        return (
          <button
            aria-controls={`transactions-${tab.value}-panel`}
            aria-selected={isSelected}
            className={cn(
              'relative min-h-12 px-4 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              isSelected &&
                'text-primary after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-primary',
            )}
            id={`transactions-${tab.value}-tab`}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function MonthlySummary({
  data,
  month,
  onMonthChange,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  onMonthChange: (month: string) => void
}) {
  return (
    <section
      aria-label={`${month.monthLabel}の収支`}
      className="rounded-2xl border bg-card px-4 py-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:px-6 sm:py-5"
    >
      <MonthPicker
        className="px-1 text-base font-semibold sm:text-lg"
        maxMonth={month.currentMonthInput}
        monthInput={month.monthInput}
        monthLabel={month.monthLabel}
        onChange={onMonthChange}
      />
      <dl className="mt-4 grid grid-cols-3 divide-x">
        <div className="min-w-0 pr-3 sm:pr-6">
          <dt className="text-xs text-muted-foreground sm:text-sm">支出合計</dt>
          <dd className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">
            {formatCurrency(data.expenseAmount)}
          </dd>
        </div>
        <div className="min-w-0 px-3 sm:px-6">
          <dt className="text-xs text-muted-foreground sm:text-sm">収入合計</dt>
          <dd className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">
            {formatCurrency(data.incomeAmount)}
          </dd>
        </div>
        <div className="min-w-0 pl-3 sm:pl-6">
          <dt className="text-xs text-muted-foreground sm:text-sm">収支</dt>
          <dd
            className={cn(
              'mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl',
              data.balanceAmount < 0
                ? 'text-expense'
                : data.balanceAmount > 0
                  ? 'text-income'
                  : 'text-muted-foreground',
            )}
          >
            {formatBalance(data.balanceAmount)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function CategoryIcon({ item }: { item: TransactionItem }) {
  const presentation = getCategoryPresentation(item)
  const Icon = presentation.icon

  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11',
        presentation.iconClassName,
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </span>
  )
}

function TransactionRow({ item }: { item: TransactionItem }) {
  return (
    <button
      aria-label={`${item.name}の取引詳細（準備中）`}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 text-left outline-none transition-colors disabled:cursor-default disabled:opacity-100 sm:px-4"
      disabled
      title="取引詳細は準備中です"
      type="button"
    >
      <CategoryIcon item={item} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold sm:text-base">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
          {item.categoryName} <span aria-hidden="true">›</span> {item.subcategoryName}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 sm:gap-4">
        {item.paymentName ? (
          <span className="hidden max-w-28 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground min-[390px]:block sm:text-sm">
            {item.paymentName}
          </span>
        ) : null}
        <span
          className={cn(
            'min-w-18 text-right text-base font-semibold tabular-nums sm:min-w-24 sm:text-lg',
            item.sign === -1 ? 'text-expense' : 'text-income',
          )}
        >
          {item.sign === -1 ? '-' : '+'}
          {formatCurrency(item.amount)}
        </span>
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </span>
    </button>
  )
}

function DayTotals({ group }: { group: TransactionDayGroup }) {
  return (
    <p className="flex flex-wrap items-center justify-end gap-x-2 text-xs font-semibold tabular-nums sm:text-sm">
      {group.expenseAmount > 0 ? <span>支出 {formatCurrency(group.expenseAmount)}</span> : null}
      {group.incomeAmount > 0 ? (
        <span className="text-income">収入 {formatCurrency(group.incomeAmount)}</span>
      ) : null}
    </p>
  )
}

function TransactionDay({ group }: { group: TransactionDayGroup }) {
  return (
    <section aria-labelledby={`transactions-${group.date}`}>
      <div className="mb-2 flex items-center justify-between gap-4 px-1">
        <h2 className="text-sm font-semibold sm:text-base" id={`transactions-${group.date}`}>
          {formatJapaneseDate(group.date)}
        </h2>
        <DayTotals group={group} />
      </div>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
        {group.items.map((item) => (
          <TransactionRow item={item} key={item.id} />
        ))}
      </div>
    </section>
  )
}

function EmptyTransactions({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
      <CalendarDays aria-hidden="true" className="size-8 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">この月の取引はありません</h2>
      <p className="mt-1 text-sm text-muted-foreground">{monthLabel}に記録された取引はありません。</p>
    </div>
  )
}

function ListPanel({
  data,
  month,
  onMonthChange,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  onMonthChange: (month: string) => void
}) {
  return (
    <div
      aria-labelledby="transactions-list-tab"
      className="motion-route-enter space-y-4 pt-4 sm:space-y-5 sm:pt-6"
      id="transactions-list-panel"
      role="tabpanel"
    >
      <MonthlySummary data={data} month={month} onMonthChange={onMonthChange} />
      {data.groups.length ? (
        <div className="space-y-5 sm:space-y-6">
          {data.groups.map((group) => (
            <TransactionDay group={group} key={group.date} />
          ))}
        </div>
      ) : (
        <EmptyTransactions monthLabel={month.monthLabel} />
      )}
    </div>
  )
}

function MonthNavigation({
  month,
  onMonthChange,
}: {
  month: TransactionMonth
  onMonthChange: (month: string) => void
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
      <Button
        aria-label="前の月"
        onClick={() => onMonthChange(month.previousMonth)}
        size="icon-lg"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <MonthPicker
        maxMonth={month.currentMonthInput}
        monthInput={month.monthInput}
        monthLabel={month.monthLabel}
        onChange={onMonthChange}
      />
      <Button
        aria-label="次の月"
        disabled={!month.canGoNext}
        onClick={() => onMonthChange(month.nextMonth)}
        size="icon-lg"
        variant="ghost"
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>
  )
}

function CalendarGrid({
  data,
  month,
  selectedDate,
  onDateChange,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  selectedDate: string
  onDateChange: (date: string) => void
}) {
  const days = useMemo(() => buildCalendarDays(month), [month])
  const itemsByDate = useMemo(() => {
    const result = new Map<string, TransactionItem[]>()
    data.items.forEach((item) => {
      result.set(item.date, [...(result.get(item.date) ?? []), item])
    })
    return result
  }, [data.items])

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {['日', '月', '火', '水', '木', '金', '土'].map((weekday) => (
          <span className="py-2" key={weekday}>
            {weekday}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isSelected = day.date === selectedDate
          const dayItems = itemsByDate.get(day.date) ?? []
          const dots = [...new Map(
            dayItems.map((item) => [item.categoryName, getCategoryPresentation(item)]),
          ).values()].slice(0, 3)

          return (
            <button
              aria-label={`${formatJapaneseDate(day.date)}${dayItems.length ? `、取引${dayItems.length}件` : '、取引なし'}`}
              aria-pressed={isSelected}
              className={cn(
                'mx-auto flex min-h-14 w-full flex-col items-center justify-center rounded-xl text-sm outline-none transition-[background-color,color,transform] focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-16 sm:text-base',
                day.isCurrentMonth
                  ? 'text-foreground hover:bg-accent'
                  : 'cursor-default text-muted-foreground/45',
                isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
              )}
              disabled={!day.isCurrentMonth}
              key={day.date}
              onClick={() => onDateChange(day.date)}
              type="button"
            >
              <span>{day.day}</span>
              <span aria-hidden="true" className="mt-1 flex h-1.5 items-center justify-center gap-1">
                {dots.map((dot, index) => (
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isSelected ? 'bg-primary-foreground' : dot.dotClassName,
                    )}
                    key={`${day.date}-${index}`}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SelectedDayDetails({
  data,
  selectedDate,
}: {
  data: TransactionsViewModel
  selectedDate: string
}) {
  const items = data.items.filter((item) => item.date === selectedDate)
  const expenseAmount = items.reduce(
    (total, item) => total + (item.sign === -1 ? item.amount : 0),
    0,
  )
  const categories = getCategoryTotals(items)

  return (
    <section
      aria-labelledby="selected-transaction-date"
      className="rounded-2xl border bg-card p-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          className="text-lg font-semibold tracking-[-0.03em] sm:text-2xl"
          id="selected-transaction-date"
        >
          {formatJapaneseDate(selectedDate, true)}
        </h2>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground sm:text-sm">支出合計</p>
          <p className="mt-1 font-semibold tabular-nums sm:text-lg">
            {formatCurrency(expenseAmount)}
          </p>
        </div>
      </div>

      {categories.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((category) => {
            const presentation = getPresentationByName(category.name)
            const Icon = presentation.icon
            return (
              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2" key={category.name}>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    presentation.iconClassName,
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{category.name}</span>
                  <span className="block truncate text-sm font-semibold tabular-nums">
                    {formatCurrency(category.amount)}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      ) : null}

      {items.length ? (
        <div className="mt-4 divide-y border-t">
          {items.map((item) => (
            <TransactionRow item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex min-h-28 flex-col items-center justify-center border-t text-center">
          <ChartPie aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">この日の取引はありません</p>
        </div>
      )}
    </section>
  )
}

function CalendarPanel({
  data,
  month,
  selectedDate,
  onMonthChange,
  onDateChange,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  selectedDate: string
  onMonthChange: (month: string) => void
  onDateChange: (date: string) => void
}) {
  return (
    <div
      aria-labelledby="transactions-calendar-tab"
      className="motion-route-enter space-y-4 pt-4 sm:space-y-5 sm:pt-6"
      id="transactions-calendar-panel"
      role="tabpanel"
    >
      <section
        aria-label={`${month.monthLabel}のカレンダー`}
        className="rounded-2xl border bg-card p-3 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-5"
      >
        <MonthNavigation month={month} onMonthChange={onMonthChange} />
        <CalendarGrid
          data={data}
          month={month}
          onDateChange={onDateChange}
          selectedDate={selectedDate}
        />
      </section>
      <SelectedDayDetails data={data} selectedDate={selectedDate} />
    </div>
  )
}

function TransactionsSkeleton({ view }: { view: TransactionView }) {
  return (
    <div
      aria-label="取引画面を読み込んでいます"
      className="space-y-4 pt-4 sm:pt-6"
      role="status"
    >
      <Skeleton className={cn('rounded-2xl', view === 'list' ? 'h-40' : 'h-[28rem]')} />
      <Skeleton className="h-72 rounded-2xl" />
      {view === 'list' ? <Skeleton className="h-64 rounded-2xl" /> : null}
    </div>
  )
}

export function TransactionsView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMonth = searchParams.get('month')
  const rawView = searchParams.get('view')
  const rawDate = searchParams.get('date')
  const normalizedMonth = useMemo(() => normalizeMonthParam(rawMonth), [rawMonth])
  const month = useMemo(() => createTransactionMonth(normalizedMonth), [normalizedMonth])
  const view = normalizeTransactionView(rawView)
  const transactions = useTransactions(month.month)
  const selectedDate = transactions.data
    ? normalizeSelectedDate(rawDate, month, transactions.data.items)
    : `${month.monthInput}-01`

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (rawMonth !== normalizedMonth) {
      next.set('month', normalizedMonth)
      changed = true
    }
    if (rawView !== view) {
      next.set('view', view)
      changed = true
    }
    if (view === 'calendar' && transactions.data && rawDate !== selectedDate) {
      next.set('date', selectedDate)
      changed = true
    }
    if (view === 'list' && rawDate) {
      next.delete('date')
      changed = true
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [
    normalizedMonth,
    rawDate,
    rawMonth,
    rawView,
    searchParams,
    selectedDate,
    setSearchParams,
    transactions.data,
    view,
  ])

  const handleViewChange = (nextView: TransactionView) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', nextView)
    if (nextView === 'list') {
      next.delete('date')
    }
    setSearchParams(next)
  }

  const handleMonthChange = (nextMonth: string) => {
    if (!nextMonth) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('month', nextMonth)
    next.delete('date')
    setSearchParams(next)
  }

  const handleDateChange = (date: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('date', date)
    setSearchParams(next)
  }

  return (
    <section
      aria-labelledby="transactions-page-title"
      className="motion-route-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 md:px-8 md:pb-10 md:pt-8"
    >
      <header className="flex items-center justify-between gap-4">
        <h1
          className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl"
          id="transactions-page-title"
        >
          取引
        </h1>
        <HeaderActions />
      </header>

      <div className="mt-4 sm:mt-6">
        <ViewTabs onChange={handleViewChange} value={view} />
        {transactions.isPending ? <TransactionsSkeleton view={view} /> : null}
        {transactions.isError ? (
          <ErrorState
            message={
              transactions.error instanceof Error
                ? transactions.error.message
                : '取引データを取得できませんでした。'
            }
            onRetry={() => void transactions.refetch()}
            title="取引を表示できません"
          />
        ) : null}
        {transactions.data && view === 'list' ? (
          <ListPanel
            data={transactions.data}
            month={month}
            onMonthChange={handleMonthChange}
          />
        ) : null}
        {transactions.data && view === 'calendar' ? (
          <CalendarPanel
            data={transactions.data}
            month={month}
            onDateChange={handleDateChange}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDate}
          />
        ) : null}
      </div>

      <Button
        aria-label="新しい取引を追加（準備中）"
        className="fixed bottom-[5.25rem] right-4 z-20 size-14 rounded-full shadow-lg disabled:opacity-75 md:bottom-6 md:right-8"
        disabled
        size="icon-lg"
        title="取引の追加は準備中です"
      >
        <Plus aria-hidden="true" className="size-7" />
      </Button>
    </section>
  )
}
