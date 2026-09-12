import { CalendarDays } from 'lucide-react'

import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

import {
  formatBalance,
  formatCurrency,
  formatJapaneseDate,
  type TransactionDayGroup,
  type TransactionMonth,
  type TransactionsViewModel,
} from '../../model/transactions'
import { TransactionRow } from './transaction-row'

function MonthlySummary({ data, month, onMonthChange }: { data: TransactionsViewModel; month: TransactionMonth; onMonthChange: (month: string) => void }) {
  return (
    <Card aria-label={`${month.monthLabel}の収支`} className="block px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex justify-end">
        <MonthPicker className="px-1 text-base font-semibold sm:text-lg" maxMonth={month.currentMonthInput} monthInput={month.monthInput} monthLabel={month.monthLabel} onChange={onMonthChange} />
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x">
        <div className="min-w-0 pr-3 sm:pr-6"><dt className="text-xs text-muted-foreground sm:text-sm">支出合計</dt><dd className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">{formatCurrency(data.expenseAmount)}</dd></div>
        <div className="min-w-0 px-3 sm:px-6"><dt className="text-xs text-muted-foreground sm:text-sm">収入合計</dt><dd className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">{formatCurrency(data.incomeAmount)}</dd></div>
        <div className="min-w-0 pl-3 sm:pl-6"><dt className="text-xs text-muted-foreground sm:text-sm">収支</dt><dd className={cn('mt-1 truncate text-lg font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl', data.balanceAmount < 0 ? 'text-expense' : data.balanceAmount > 0 ? 'text-income' : 'text-muted-foreground')}>{formatBalance(data.balanceAmount)}</dd></div>
      </dl>
    </Card>
  )
}

function TransactionDay({ group, onOpen }: { group: TransactionDayGroup; onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby={`transactions-${group.date}`}>
      <div className="mb-2 flex items-center justify-between gap-4 px-1">
        <h2 className="text-sm font-semibold sm:text-base" id={`transactions-${group.date}`}>{formatJapaneseDate(group.date)}</h2>
        <p className="flex flex-wrap items-center justify-end gap-x-2 text-xs font-semibold tabular-nums sm:text-sm">
          {group.expenseAmount > 0 ? <span>支出 {formatCurrency(group.expenseAmount)}</span> : null}
          {group.incomeAmount > 0 ? <span className="text-income">収入 {formatCurrency(group.incomeAmount)}</span> : null}
        </p>
      </div>
      <Card className="block divide-y overflow-hidden p-0">
        {group.items.map((item) => <TransactionRow item={item} key={item.id} onOpen={onOpen} />)}
      </Card>
    </section>
  )
}

function EmptyTransactions({ hasFilters, monthLabel, onClearFilters }: { hasFilters: boolean; monthLabel: string; onClearFilters: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
      <CalendarDays aria-hidden="true" className="size-8 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">{hasFilters ? '条件に一致する取引はありません' : 'この月の取引はありません'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hasFilters ? '絞り込み条件を変更するか、すべて解除してください。' : `${monthLabel}に記録された取引はありません。`}</p>
      {hasFilters ? <Button className="mt-4" onClick={onClearFilters} variant="outline">すべて解除</Button> : null}
    </div>
  )
}

export function TransactionsListPanel({ data, month, onOpen, onMonthChange, hasFilters, onClearFilters }: { data: TransactionsViewModel; month: TransactionMonth; onOpen: (id: string) => void; onMonthChange: (month: string) => void; hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div aria-labelledby="transactions-list-tab" className="motion-route-enter space-y-4 pt-4 sm:space-y-5 sm:pt-6" id="transactions-list-panel" role="tabpanel">
      <MonthlySummary data={data} month={month} onMonthChange={onMonthChange} />
      {data.groups.length ? <div className="space-y-5 sm:space-y-6">{data.groups.map((group) => <TransactionDay group={group} key={group.date} onOpen={onOpen} />)}</div> : <EmptyTransactions hasFilters={hasFilters} monthLabel={month.monthLabel} onClearFilters={onClearFilters} />}
    </div>
  )
}
