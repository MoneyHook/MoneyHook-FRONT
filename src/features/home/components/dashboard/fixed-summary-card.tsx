import { ArrowRight, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency, formatPercent, type HomeDashboardViewModel } from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

export function FixedSummaryCard({ data, month }: { data: HomeDashboardViewModel; month: string }) {
  return (
    <DashboardCard>
      <h2 className="text-sm font-semibold leading-none sm:text-lg sm:leading-normal">
        固定費サマリー
      </h2>
      <div className="mt-2 grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-2 sm:mt-5 sm:grid-cols-[minmax(14rem,0.8fr)_1.2fr] sm:gap-6">
        <div className="rounded-xl bg-success/8 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/12 text-success sm:size-10">
              <WalletCards aria-hidden="true" className="size-4 sm:size-5" />
            </span>
            <div>
              <p className="text-[0.625rem] text-muted-foreground sm:text-xs">月額</p>
              <p className="text-lg font-semibold leading-none tabular-nums sm:mt-1 sm:text-2xl sm:leading-normal">
                {formatCurrency(data.fixedMonthlyAmount)}
              </p>
            </div>
          </div>
          <p className="mt-1.5 whitespace-nowrap text-[0.5625rem] text-muted-foreground sm:mt-4 sm:text-sm">
            年間換算{' '}
            <span className="ml-2 font-semibold text-foreground tabular-nums">
              {formatCurrency(data.fixedAnnualizedAmount)}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[0.625rem] leading-none text-muted-foreground sm:text-xs sm:leading-normal">
            総支出に占める固定費の割合
          </p>
          <p className="text-xl font-semibold leading-none tabular-nums sm:mt-1 sm:text-2xl sm:leading-normal">
            {formatPercent(data.fixedTotalExpenseRatio)}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted sm:mt-3 sm:h-2">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.min(data.fixedTotalExpenseRatio, 100)}%` }}
            />
          </div>
          <div className="mt-1 border-t pt-1 text-right sm:mt-5 sm:pt-3">
            <Button asChild className="h-6 px-0 text-[0.625rem] leading-none text-primary sm:h-auto sm:text-sm sm:leading-normal" variant="link">
              <Link to={`/app/analysis?view=fixed&month=${month}`}>
                固定費の詳細を見る <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
