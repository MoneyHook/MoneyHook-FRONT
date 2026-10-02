import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import type {
  CategoryChange,
  HomeChangesViewModel,
} from '../../model/home-changes'
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

function ChangePanel({ change }: { change: CategoryChange }) {
  const isIncrease = change.difference > 0
  const Icon = isIncrease ? ArrowUpRight : ArrowDownRight
  return (
    <div
      className={cn(
        'rounded-xl p-2 sm:p-4',
        isIncrease ? 'bg-expense/6' : 'bg-chart-2/6',
      )}
    >
      <p className="flex items-center gap-1 text-[0.625rem] font-semibold sm:gap-2 sm:text-sm">
        <Icon
          aria-hidden="true"
          className={cn('size-5', isIncrease ? 'text-expense' : 'text-chart-2')}
        />
        {change.isNewExpense
          ? '今月発生した支出'
          : `支出が${isIncrease ? '増えた' : '減った'}項目`}
      </p>
      <div className="mt-2 flex items-center justify-between gap-1.5 sm:mt-5 sm:gap-3">
        <p className="text-xs font-semibold sm:text-base">{change.name}</p>
        <p
          className={cn(
            'text-xs font-semibold tabular-nums sm:text-base',
            isIncrease ? 'text-expense' : 'text-chart-2',
          )}
        >
          {formatSignedCurrency(change.difference)}
        </p>
      </div>
      <p className="mt-1 text-[0.5625rem] leading-3.5 text-muted-foreground sm:mt-2 sm:text-xs sm:leading-5">
        前月{formatCurrency(change.previousAmount)} → 今月
        {formatCurrency(change.currentAmount)}
        {change.differenceRate !== null
          ? `（${formatPercent(Math.abs(change.differenceRate))}${isIncrease ? '増' : '減'}）`
          : null}
      </p>
    </div>
  )
}

function formatRange(range: HomeChangesViewModel['currentRange']) {
  const formatDate = (date: string) =>
    `${date.slice(0, 4)}/${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`
  return `${formatDate(range.start_date)}〜${formatDate(range.end_date)}`
}

export function ChangesCard({ data }: { data: HomeChangesViewModel }) {
  return (
    <DashboardCard>
      <h2 className="text-sm font-semibold sm:text-lg">今月の変化</h2>
      <p className="mt-1 text-[0.625rem] text-muted-foreground sm:text-xs">
        変動費・{data.isCurrentMonth ? '前月同期間比' : '前月比'}
      </p>
      <p className="mt-1 text-[0.5625rem] leading-3.5 text-muted-foreground sm:text-xs sm:leading-5">
        今月 {formatRange(data.currentRange)}
        <br />
        前月 {formatRange(data.previousRange)}
      </p>
      <div className="mt-2 space-y-2 sm:mt-5 sm:space-y-4">
        {data.increase ? <ChangePanel change={data.increase} /> : null}
        {data.decrease ? <ChangePanel change={data.decrease} /> : null}
      </div>
    </DashboardCard>
  )
}
