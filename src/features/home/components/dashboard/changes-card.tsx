import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import {
  type CategoryChange,
  formatCurrency,
  formatSignedCurrency,
  type HomeDashboardViewModel,
} from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

function ChangePanel({
  change,
  direction,
}: {
  change: CategoryChange | null
  direction: 'increase' | 'decrease'
}) {
  const isIncrease = direction === 'increase'
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
        支出が{isIncrease ? '増えた' : '減った'}項目
      </p>
      {change ? (
        <>
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
            前月の{formatCurrency(change.previousAmount)}から変化しました
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground sm:mt-5 sm:text-sm">
          該当する項目はありません
        </p>
      )}
    </div>
  )
}

export function ChangesCard({ data }: { data: HomeDashboardViewModel }) {
  return (
    <DashboardCard>
      <h2 className="text-sm font-semibold sm:text-lg">今月の変化</h2>
      <div className="mt-2 space-y-2 sm:mt-5 sm:space-y-4">
        <ChangePanel change={data.increase} direction="increase" />
        <ChangePanel change={data.decrease} direction="decrease" />
      </div>
    </DashboardCard>
  )
}
