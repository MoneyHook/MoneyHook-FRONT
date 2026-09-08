import {
  CalendarDays,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  Funnel,
  Plus,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { ErrorState } from '@/shared/components/app-state'
import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'
import { getCategoryPresentation as getCategoryPresentationShared } from '@/shared/lib/category-presentation'

import { useTransactions } from '../api/use-transactions'
import { useTransactionFilterReferences } from '../api/use-transaction-filter-references'
import {
  buildCalendarDays,
  buildTransactionsViewModelFromItems,
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
import {
  EMPTY_TRANSACTION_FILTERS,
  filterTransactions,
  getActiveFilterCount,
  parseTransactionFilters,
  summarizeFilteredTransactions,
  writeTransactionFilters,
  type TransactionFilters,
} from '../model/transaction-filters'

function getCategoryPresentation(item: Pick<TransactionItem, 'categoryName' | 'sign'>) {
  return getCategoryPresentationShared(item.categoryName, { isIncome: item.sign === 1 })
}

function getPresentationByName(name: string) {
  return getCategoryPresentationShared(name)
}

function FilterButton({
  activeCount,
  className,
  ...props
}: ComponentProps<typeof Button> & { activeCount: number }) {
  return (
    <Button
      aria-label="取引を絞り込む"
      className={cn('relative', className)}
      size="icon-lg"
      variant="ghost"
      {...props}
    >
      <Funnel aria-hidden="true" className="size-5" />
      {activeCount ? (
        <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  )
}

type FilterReferences = ReturnType<typeof useTransactionFilterReferences>

function FilterChoice({
  children,
  onClick,
  selected,
}: {
  children: ReactNode
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        'min-h-9 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function FilterSection({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-start">
      <h3 className="pt-2 text-sm font-semibold">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

function FilterPanel({
  draft,
  onChange,
  onClear,
  onApply,
  references,
}: {
  draft: TransactionFilters
  onChange: (next: TransactionFilters) => void
  onClear: () => void
  onApply: () => void
  references: FilterReferences
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
        <FilterSection label="収支">
          {([
            [null, 'すべて'],
            ['expense', '支出'],
            ['income', '収入'],
          ] as const).map(([value, label]) => (
            <FilterChoice
              key={label}
              onClick={() => onChange({ ...draft, sign: value })}
              selected={draft.sign === value}
            >
              {label}
            </FilterChoice>
          ))}
        </FilterSection>

        <FilterSection label="カテゴリ">
          <FilterChoice
            onClick={() => onChange({ ...draft, categoryId: null })}
            selected={!draft.categoryId}
          >
            すべて
          </FilterChoice>
          {references.isPending ? <span className="py-2 text-sm text-muted-foreground">読み込み中…</span> : null}
          {!references.isPending && references.categories.map((category) => (
            <FilterChoice
              key={category.category_id}
              onClick={() => onChange({ ...draft, categoryId: category.category_id })}
              selected={draft.categoryId === category.category_id}
            >
              {category.category_name}
            </FilterChoice>
          ))}
        </FilterSection>

        <FilterSection label="支払方法">
          <FilterChoice
            onClick={() => onChange({ ...draft, paymentId: null })}
            selected={!draft.paymentId}
          >
            すべて
          </FilterChoice>
          {references.isPending ? <span className="py-2 text-sm text-muted-foreground">読み込み中…</span> : null}
          {!references.isPending && references.payments.map((payment) => (
            <FilterChoice
              key={payment.payment_id}
              onClick={() => onChange({ ...draft, paymentId: payment.payment_id })}
              selected={draft.paymentId === payment.payment_id}
            >
              {payment.payment_name}
            </FilterChoice>
          ))}
        </FilterSection>

        <FilterSection label="種別">
          {([
            [null, 'すべて'],
            ['fixed', '固定費'],
            ['variable', '変動費'],
          ] as const).map(([value, label]) => (
            <FilterChoice
              key={label}
              onClick={() => onChange({ ...draft, fixed: value })}
              selected={draft.fixed === value}
            >
              {label}
            </FilterChoice>
          ))}
        </FilterSection>
        {references.isError ? (
          <p className="text-sm text-muted-foreground">カテゴリと支払方法を取得できませんでした。</p>
        ) : null}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t px-5 py-4 md:px-6 md:py-5">
        <Button onClick={onClear} type="button" variant="outline">すべて解除</Button>
        <Button onClick={onApply} type="button">適用</Button>
      </div>
    </div>
  )
}

function ActiveFilterChips({
  filters,
  items,
  onRemove,
  references,
}: {
  filters: TransactionFilters
  items: TransactionItem[]
  onRemove: (key: keyof TransactionFilters) => void
  references: FilterReferences
}) {
  const categoryName = filters.categoryId
    ? references.categories.find((item) => item.category_id === filters.categoryId)?.category_name ??
      items.find((item) => item.categoryId === filters.categoryId)?.categoryName
    : null
  const paymentName = filters.paymentId
    ? references.payments.find((item) => item.payment_id === filters.paymentId)?.payment_name ??
      items.find((item) => item.paymentId === filters.paymentId)?.paymentName
    : null
  const entries = [
    filters.sign ? { key: 'sign' as const, label: filters.sign === 'expense' ? '支出' : '収入' } : null,
    categoryName ? { key: 'categoryId' as const, label: categoryName } : null,
    paymentName ? { key: 'paymentId' as const, label: paymentName } : null,
    filters.fixed ? { key: 'fixed' as const, label: filters.fixed === 'fixed' ? '固定費' : '変動費' } : null,
  ].filter(Boolean) as Array<{ key: keyof TransactionFilters; label: string }>

  if (!entries.length) return null

  return (
    <div aria-label="適用中の絞り込み" className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <button
          aria-label={`${entry.label}を解除`}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          key={entry.key}
          onClick={() => onRemove(entry.key)}
          type="button"
        >
          <span aria-hidden="true">{entry.label}</span><X aria-hidden="true" className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

function FilterResultSummary({ summary, sign }: { summary: ReturnType<typeof summarizeFilteredTransactions>; sign: TransactionFilters['sign'] }) {
  const detail = sign === 'expense'
    ? `支出 ${formatCurrency(summary.expenseAmount)}`
    : sign === 'income'
      ? `収入 ${formatCurrency(summary.incomeAmount)}`
      : `支出 ${formatCurrency(summary.expenseAmount)}・収入 ${formatCurrency(summary.incomeAmount)}・収支 ${formatBalance(summary.balanceAmount)}`
  return <p className="text-sm font-semibold tabular-nums sm:text-base">{summary.count}件・{detail}</p>
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
                'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary',
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

function TransactionRow({ item, onOpen }: { item: TransactionItem; onOpen: (id: string) => void }) {
  return (
    <button
      aria-label={`${item.name}を編集`}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 text-left outline-none transition-colors hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-4"
      onClick={() => onOpen(item.id)}
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

function TransactionDay({ group, onOpen }: { group: TransactionDayGroup; onOpen: (id: string) => void }) {
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
            <TransactionRow item={item} key={item.id} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

function EmptyTransactions({
  hasFilters,
  monthLabel,
  onClearFilters,
}: {
  hasFilters: boolean
  monthLabel: string
  onClearFilters?: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
      <CalendarDays aria-hidden="true" className="size-8 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">{hasFilters ? '条件に一致する取引はありません' : 'この月の取引はありません'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters ? '絞り込み条件を変更するか、すべて解除してください。' : `${monthLabel}に記録された取引はありません。`}
      </p>
      {hasFilters && onClearFilters ? <Button className="mt-4" onClick={onClearFilters} variant="outline">すべて解除</Button> : null}
    </div>
  )
}

function ListPanel({
  data,
  month,
  onOpen,
  onMonthChange,
  hasFilters,
  onClearFilters,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  onOpen: (id: string) => void
  onMonthChange: (month: string) => void
  hasFilters: boolean
  onClearFilters: () => void
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
            <TransactionDay group={group} key={group.date} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <EmptyTransactions hasFilters={hasFilters} monthLabel={month.monthLabel} onClearFilters={onClearFilters} />
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
  onOpen,
  selectedDate,
}: {
  data: TransactionsViewModel
  onOpen: (id: string) => void
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
            <TransactionRow item={item} key={item.id} onOpen={onOpen} />
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
  onOpen,
  selectedDate,
  onMonthChange,
  onDateChange,
}: {
  data: TransactionsViewModel
  month: TransactionMonth
  onOpen: (id: string) => void
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
      <SelectedDayDetails data={data} onOpen={onOpen} selectedDate={selectedDate} />
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
      <Skeleton className={cn('rounded-2xl', view === 'list' ? 'h-40' : 'h-112')} />
      <Skeleton className="h-72 rounded-2xl" />
      {view === 'list' ? <Skeleton className="h-64 rounded-2xl" /> : null}
    </div>
  )
}

export function TransactionsView() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false)
  const rawMonth = searchParams.get('month')
  const rawView = searchParams.get('view')
  const rawDate = searchParams.get('date')
  const normalizedMonth = useMemo(() => normalizeMonthParam(rawMonth), [rawMonth])
  const month = useMemo(() => createTransactionMonth(normalizedMonth), [normalizedMonth])
  const view = normalizeTransactionView(rawView)
  const transactions = useTransactions(month.month)
  const filters = useMemo(() => parseTransactionFilters(searchParams), [searchParams])
  const activeFilterCount = getActiveFilterCount(filters)
  const filterOpen = mobileFilterOpen || desktopFilterOpen
  const references = useTransactionFilterReferences(filterOpen || activeFilterCount > 0)
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(filters)
  const filteredData = useMemo(
    () => transactions.data
      ? buildTransactionsViewModelFromItems(filterTransactions(transactions.data.items, filters))
      : null,
    [filters, transactions.data],
  )
  const filterSummary = useMemo(
    () => summarizeFilteredTransactions(filteredData?.items ?? []),
    [filteredData],
  )
  const selectedDate = transactions.data
    ? normalizeSelectedDate(rawDate, month, filteredData?.items ?? [])
    : `${month.monthInput}-01`

  const updateFilters = useCallback((nextFilters: TransactionFilters) => {
    const next = writeTransactionFilters(new URLSearchParams(searchParams), nextFilters)
    next.delete('date')
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  const openMobileFilters = () => {
    setDraftFilters(filters)
    setMobileFilterOpen(true)
  }

  const openDesktopFilters = () => {
    setDraftFilters(filters)
    setDesktopFilterOpen(true)
  }

  const applyFilters = () => {
    updateFilters(draftFilters)
    setMobileFilterOpen(false)
    setDesktopFilterOpen(false)
  }

  const clearAppliedFilters = () => updateFilters(EMPTY_TRANSACTION_FILTERS)

  useEffect(() => {
    const categoryIsInvalid = filters.categoryId && references.categoriesReady && !references.categories.some(
      (category) => category.category_id === filters.categoryId,
    )
    const paymentIsInvalid = filters.paymentId && references.paymentsReady && !references.payments.some(
      (payment) => payment.payment_id === filters.paymentId,
    )

    if (categoryIsInvalid || paymentIsInvalid) {
      updateFilters({
        ...filters,
        categoryId: categoryIsInvalid ? null : filters.categoryId,
        paymentId: paymentIsInvalid ? null : filters.paymentId,
      })
    }
  }, [filters, references.categories, references.categoriesReady, references.payments, references.paymentsReady, updateFilters])

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

  const openTransaction = (transactionId: string) => {
    navigate(`/app/transactions/${encodeURIComponent(transactionId)}/edit`, {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    })
  }

  return (
    <>
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
          <div className="flex items-center gap-1">
            <div className="md:hidden">
              <Button aria-label="取引を絞り込む" className="relative" onClick={openMobileFilters} size="icon-lg" variant="ghost">
                <Funnel aria-hidden="true" className="size-5" />
                {activeFilterCount ? <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeFilterCount}</span> : null}
              </Button>
            </div>
            <FilterButton activeCount={activeFilterCount} className="hidden md:inline-flex" onClick={openDesktopFilters} />
          </div>
        </header>

        <div className="mt-4 sm:mt-6">
          <ViewTabs onChange={handleViewChange} value={view} />
          {transactions.data && activeFilterCount ? (
            <div className="space-y-3 pt-4 sm:pt-5">
              <ActiveFilterChips filters={filters} items={transactions.data.items} onRemove={(key) => updateFilters({ ...filters, [key]: null })} references={references} />
              <FilterResultSummary sign={filters.sign} summary={filterSummary} />
            </div>
          ) : null}
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
          {transactions.data && filteredData && view === 'list' ? (
            <ListPanel
              data={filteredData}
              hasFilters={Boolean(activeFilterCount)}
              month={month}
              onClearFilters={clearAppliedFilters}
              onOpen={openTransaction}
              onMonthChange={handleMonthChange}
            />
          ) : null}
          {transactions.data && filteredData && view === 'calendar' ? (
            <CalendarPanel
              data={filteredData}
              month={month}
              onDateChange={handleDateChange}
              onOpen={openTransaction}
              onMonthChange={handleMonthChange}
              selectedDate={selectedDate}
            />
          ) : null}
        </div>
      </section>

      <Sheet onOpenChange={setMobileFilterOpen} open={mobileFilterOpen}>
        <SheetContent className="max-h-[88svh] rounded-t-[2rem] border-x-0 px-0 pb-[max(1rem,env(safe-area-inset-bottom))]" showCloseButton={false} side="bottom">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <h2 className="text-xl font-semibold">絞り込み</h2>
            <Button aria-label="絞り込みを閉じる" onClick={() => setMobileFilterOpen(false)} size="icon-lg" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <FilterPanel
            draft={draftFilters}
            onApply={applyFilters}
            onChange={setDraftFilters}
            onClear={() => setDraftFilters(EMPTY_TRANSACTION_FILTERS)}
            references={references}
          />
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={setDesktopFilterOpen} open={desktopFilterOpen}>
        <SheetContent className="hidden inset-y-4 right-4 h-[calc(100%-2rem)] w-[min(26rem,calc(100vw-2rem))] max-w-none gap-0 rounded-l-[2rem] rounded-r-none border md:flex" showCloseButton={false} side="right">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <h2 className="text-xl font-semibold">絞り込み</h2>
            <Button aria-label="絞り込みを閉じる" onClick={() => setDesktopFilterOpen(false)} size="icon-lg" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <FilterPanel
            draft={draftFilters}
            onApply={applyFilters}
            onChange={setDraftFilters}
            onClear={() => setDraftFilters(EMPTY_TRANSACTION_FILTERS)}
            references={references}
          />
        </SheetContent>
      </Sheet>

      <Button
        aria-label="新しい取引を追加"
        className="fixed bottom-6 right-8 z-30 hidden size-14 rounded-full shadow-lg md:inline-flex"
        onClick={() => navigate('/app/transactions/new')}
        size="icon-lg"
        title="新しい取引を追加"
      >
        <Plus aria-hidden="true" className="size-7" />
      </Button>
    </>
  )
}
