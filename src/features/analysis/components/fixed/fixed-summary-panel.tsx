import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AnalysisFixedViewModel } from '../../model/analysis-fixed'
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../../model/analysis-overview'
import { AnalysisPanel } from './fixed-analysis-panel'

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return '—'
  }
  if (value === 0) {
    return '±0.0%'
  }
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`
}

export function FixedSummaryPanel({ data }: { data: AnalysisFixedViewModel }) {
  const isIncrease = data.differenceAmount > 0
  const isDecrease = data.differenceAmount < 0
  const DifferenceIcon = isIncrease
    ? ArrowUpRight
    : isDecrease
      ? ArrowDownRight
      : ArrowRight

  return (
    <AnalysisPanel className="p-3 sm:p-6">
      <h2 className="text-sm font-semibold sm:text-lg">固定費サマリー</h2>
      <div className="mt-3 grid grid-cols-3 divide-x sm:mt-6">
        <div className="min-w-0 pr-3 sm:pr-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            月平均
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.monthlyAverage)}
          </p>
          <p className="mt-1 truncate text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            総支出の {formatPercent(data.totalExpenseRatio)}
          </p>
        </div>
        <div className="min-w-0 px-3 sm:px-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            年間換算
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.annualizedAmount)}
          </p>
          <p className="mt-1 truncate text-[0.625rem] text-muted-foreground sm:text-sm">
            月平均 × 12か月
          </p>
        </div>
        <div className="min-w-0 pl-3 sm:pl-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            変動額（前月比）
          </p>
          <p
            className={cn(
              'mt-1 flex items-center gap-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl',
              isIncrease
                ? 'text-expense'
                : isDecrease
                  ? 'text-success'
                  : 'text-foreground',
            )}
          >
            <DifferenceIcon aria-hidden="true" className="size-4 shrink-0 sm:size-6" />
            {formatSignedCurrency(data.differenceAmount)}
          </p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            {formatSignedPercent(data.differenceRate)}
          </p>
        </div>
      </div>
    </AnalysisPanel>
  )
}
