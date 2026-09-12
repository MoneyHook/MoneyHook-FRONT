import { ChartPie, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'

import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

import {
  buildCalendarDays,
  formatCurrency,
  formatJapaneseDate,
  getCategoryTotals,
  type TransactionItem,
  type TransactionMonth,
  type TransactionsViewModel,
} from '../../model/transactions'
import { TransactionRow } from './transaction-row'

function MonthNavigation({ month, onMonthChange }: { month: TransactionMonth; onMonthChange: (month: string) => void }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
      <Button aria-label="前の月" onClick={() => onMonthChange(month.previousMonth)} size="icon-lg" variant="ghost"><ChevronLeft aria-hidden="true" className="size-5" /></Button>
      <MonthPicker maxMonth={month.currentMonthInput} monthInput={month.monthInput} monthLabel={month.monthLabel} onChange={onMonthChange} />
      <Button aria-label="次の月" disabled={!month.canGoNext} onClick={() => onMonthChange(month.nextMonth)} size="icon-lg" variant="ghost"><ChevronRight aria-hidden="true" className="size-5" /></Button>
    </div>
  )
}

function CalendarGrid({ data, month, selectedDate, onDateChange }: { data: TransactionsViewModel; month: TransactionMonth; selectedDate: string; onDateChange: (date: string) => void }) {
  const days = useMemo(() => buildCalendarDays(month), [month])
  const itemsByDate = useMemo(() => {
    const result = new Map<string, TransactionItem[]>()
    data.items.forEach((item) => result.set(item.date, [...(result.get(item.date) ?? []), item]))
    return result
  }, [data.items])

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">{['日', '月', '火', '水', '木', '金', '土'].map((weekday) => <span className="py-2" key={weekday}>{weekday}</span>)}</div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isSelected = day.date === selectedDate
          const dayItems = itemsByDate.get(day.date) ?? []
          const dots = [...new Map(dayItems.map((item) => [item.categoryName, getCategoryPresentation(item.categoryName, { isIncome: item.sign === 1 })])).values()].slice(0, 3)
          return (
            <button
              aria-label={`${formatJapaneseDate(day.date)}${dayItems.length ? `、取引${dayItems.length}件` : '、取引なし'}`}
              aria-pressed={isSelected}
              className={cn('mx-auto flex min-h-14 w-full flex-col items-center justify-center rounded-xl text-sm outline-none transition-[background-color,color,transform] focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-16 sm:text-base', day.isCurrentMonth ? 'text-foreground hover:bg-accent' : 'cursor-default text-muted-foreground/45', isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary')}
              disabled={!day.isCurrentMonth}
              key={day.date}
              onClick={() => onDateChange(day.date)}
              type="button"
            >
              <span>{day.day}</span>
              <span aria-hidden="true" className="mt-1 flex h-1.5 items-center justify-center gap-1">{dots.map((dot, index) => <span className={cn('size-1.5 rounded-full', isSelected ? 'bg-primary-foreground' : dot.dotClassName)} key={`${day.date}-${index}`} />)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SelectedDayDetails({ data, onOpen, selectedDate }: { data: TransactionsViewModel; onOpen: (id: string) => void; selectedDate: string }) {
  const items = data.items.filter((item) => item.date === selectedDate)
  const expenseAmount = items.reduce((total, item) => total + (item.sign === -1 ? item.amount : 0), 0)
  const categories = getCategoryTotals(items)

  return (
    <Card aria-labelledby="selected-transaction-date" className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-[-0.03em] sm:text-2xl" id="selected-transaction-date">{formatJapaneseDate(selectedDate, true)}</h2>
        <div className="shrink-0 text-right"><p className="text-xs text-muted-foreground sm:text-sm">支出合計</p><p className="mt-1 font-semibold tabular-nums sm:text-lg">{formatCurrency(expenseAmount)}</p></div>
      </div>
      {categories.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((category) => {
            const presentation = getCategoryPresentation(category.name)
            const Icon = presentation.icon
            return <div className="flex min-w-0 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2" key={category.name}><span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', presentation.iconClassName)}><Icon aria-hidden="true" className="size-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-medium">{category.name}</span><span className="block truncate text-sm font-semibold tabular-nums">{formatCurrency(category.amount)}</span></span></div>
          })}
        </div>
      ) : null}
      {items.length ? <div className="mt-4 divide-y border-t">{items.map((item) => <TransactionRow item={item} key={item.id} onOpen={onOpen} />)}</div> : <div className="mt-5 flex min-h-28 flex-col items-center justify-center border-t text-center"><ChartPie aria-hidden="true" className="size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">この日の取引はありません</p></div>}
    </Card>
  )
}

export function TransactionsCalendarPanel({ data, month, onOpen, selectedDate, onMonthChange, onDateChange }: { data: TransactionsViewModel; month: TransactionMonth; onOpen: (id: string) => void; selectedDate: string; onMonthChange: (month: string) => void; onDateChange: (date: string) => void }) {
  return (
    <div aria-labelledby="transactions-calendar-tab" className="motion-route-enter space-y-4 pt-4 sm:space-y-5 sm:pt-6" id="transactions-calendar-panel" role="tabpanel">
      <Card aria-label={`${month.monthLabel}のカレンダー`} className="p-3 sm:p-5"><MonthNavigation month={month} onMonthChange={onMonthChange} /><CalendarGrid data={data} month={month} onDateChange={onDateChange} selectedDate={selectedDate} /></Card>
      <SelectedDayDetails data={data} onOpen={onOpen} selectedDate={selectedDate} />
    </div>
  )
}
