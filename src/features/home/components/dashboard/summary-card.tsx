import { ArrowDownRight, ArrowUpRight, CalendarDays, WalletCards, type LucideIcon } from 'lucide-react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/shared/lib/utils'
import { formatCurrency, formatPercent, formatSignedCurrency, type HomeDashboardViewModel } from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

function Metric({
  icon: Icon,
  iconClassName,
  label,
  value,
  caption,
  captionClassName,
}: {
  icon: LucideIcon
  iconClassName: string
  label: string
  value: string
  caption: string
  captionClassName?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full sm:size-9',
          iconClassName,
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 sm:size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[0.625rem] text-muted-foreground sm:text-sm">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums sm:mt-0.5 sm:text-lg">{value}</p>
        <p
          className={cn(
            'text-[0.625rem] font-medium tabular-nums sm:mt-0.5 sm:text-xs',
            captionClassName,
          )}
        >
          {caption}
        </p>
      </div>
    </div>
  )
}

function BudgetRing({ budgetRatio }: { budgetRatio: number | null }) {
  const isConfigured = budgetRatio !== null
  const progress = isConfigured ? Math.min(Math.max(budgetRatio, 0), 100) : 0
  const ringColor = isConfigured && budgetRatio > 100 ? 'var(--expense)' : 'var(--success)'
  const label = isConfigured ? `予算比 ${formatPercent(budgetRatio)}` : '予算比は未設定です'

  return (
    <div aria-label={label} className="relative size-20 shrink-0 sm:size-36">
      <ResponsiveContainer height="100%" width="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          data={[{ value: progress }]}
          endAngle={-270}
          innerRadius="82%"
          outerRadius="100%"
          startAngle={90}
        >
          <PolarAngleAxis
            axisLine={false}
            domain={[0, 100]}
            tick={false}
            type="number"
          />
          <RadialBar
            background={{ fill: 'var(--muted)' }}
            cornerRadius={10}
            dataKey="value"
            fill={isConfigured ? ringColor : 'transparent'}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-semibold tabular-nums sm:text-sm">
          {isConfigured ? formatPercent(budgetRatio) : '未設定'}
        </span>
        <span className="text-[0.625rem] text-muted-foreground sm:mt-0.5 sm:text-xs">予算比</span>
      </div>
    </div>
  )
}

export function SummaryCard({ data }: { data: HomeDashboardViewModel }) {
  const differenceTone =
    data.differenceAmount > 0
      ? 'text-expense'
      : data.differenceAmount < 0
        ? 'text-chart-2'
        : 'text-muted-foreground'

  return (
    <DashboardCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold sm:text-base">今月の支出</p>
          <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.045em] tabular-nums sm:mt-5 sm:text-5xl">
            {formatCurrency(data.expenseAmount)}
          </p>
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium sm:mt-2 sm:text-sm',
              differenceTone,
            )}
          >
            <span className="text-muted-foreground">前月比</span>
            <span>{formatSignedCurrency(data.differenceAmount)}</span>
            <span>
              ({data.differenceRate === null ? '—' : formatPercent(Math.abs(data.differenceRate))})
            </span>
            {data.differenceAmount !== 0 ? (
              data.differenceAmount > 0 ? (
                <ArrowUpRight aria-label="増加" className="size-4" />
              ) : (
                <ArrowDownRight aria-label="減少" className="size-4" />
              )
            ) : null}
          </div>
        </div>
        <BudgetRing budgetRatio={data.budgetRatio} />
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x sm:mt-7">
        <div className="pr-2 sm:pr-5">
          <Metric
            caption={formatPercent(data.fixedExpenseRatio)}
            captionClassName="text-success"
            icon={WalletCards}
            iconClassName="bg-success/12 text-success"
            label="固定費"
            value={formatCurrency(data.fixedExpenseAmount)}
          />
        </div>
        <div className="px-2 sm:px-5">
          <Metric
            caption={formatPercent(data.variableExpenseRatio)}
            captionClassName="text-chart-2"
            icon={WalletCards}
            iconClassName="bg-chart-2/12 text-chart-2"
            label="変動費"
            value={formatCurrency(data.variableExpenseAmount)}
          />
        </div>
        <div className="pl-2 sm:pl-5">
          <Metric
            caption={data.dayCaption}
            captionClassName="text-muted-foreground"
            icon={CalendarDays}
            iconClassName="bg-warning/12 text-warning"
            label="1日あたり平均"
            value={formatCurrency(data.dailyAverage)}
          />
        </div>
      </div>
    </DashboardCard>
  )
}
