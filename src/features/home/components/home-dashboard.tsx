import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  House,
  ShoppingBag,
  Tags,
  TrainFront,
  Utensils,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ErrorState } from '@/shared/components/app-state'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import { useHomeDashboard } from '../api/use-home-dashboard'
import {
  createMonthContext,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  normalizeMonthParam,
  type CategoryChange,
  type CategorySummary,
  type HomeDashboardViewModel,
} from '../model/home-dashboard'

const categoryIcons: Record<string, LucideIcon> = {
  食費: Utensils,
  住居: House,
  住宅: House,
  交通: TrainFront,
  娯楽: Clapperboard,
  日用品: ShoppingBag,
}

const categoryTones = [
  'bg-warning/12 text-warning',
  'bg-success/12 text-success',
  'bg-chart-2/12 text-chart-2',
  'bg-chart-4/12 text-chart-4',
  'bg-chart-5/12 text-chart-5',
]

function DashboardCard({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_6%,transparent)] sm:p-6',
        'max-sm:p-3',
        className,
      )}
    >
      {children}
    </section>
  )
}

function MonthHeader({
  monthInput,
  monthLabel,
  maxMonth,
  onChange,
}: {
  monthInput: string
  monthLabel: string
  maxMonth: string
  onChange: (value: string) => void
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1
        className="text-xl font-semibold tracking-[-0.04em] sm:text-3xl"
        id="home-page-title"
      >
        ホーム
      </h1>
      <div className="flex items-center gap-1">
        <label className="relative flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors hover:bg-accent sm:gap-2 sm:text-base">
          <CalendarDays aria-hidden="true" className="size-5" />
          <span>{monthLabel}</span>
          <ChevronDown aria-hidden="true" className="size-4" />
          <input
            aria-label="対象月"
            className="absolute inset-0 cursor-pointer opacity-0"
            max={maxMonth}
            onChange={(event) => onChange(event.target.value)}
            type="month"
            value={monthInput}
          />
        </label>
        <Button aria-label="通知（未対応）" disabled size="icon" variant="ghost">
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}

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

function SummaryCard({ data }: { data: HomeDashboardViewModel }) {
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

function PaceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; dataKey?: string }>
  label?: number
}) {
  if (!active || !payload?.length) {
    return null
  }
  const current = payload.find((item) => item.dataKey === 'current')?.value
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p>{label}日</p>
      <p className="mt-1 font-semibold tabular-nums">
        {current === undefined ? 'データなし' : formatCurrency(current)}
      </p>
    </div>
  )
}

function SpendingPaceCard({ data }: { data: HomeDashboardViewModel }) {
  return (
    <DashboardCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold sm:text-lg">
          支出ペース <span className="ml-1 text-xs">（累計）</span>
        </h2>
        <div className="flex items-center gap-5 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-7 rounded-full bg-chart-1" /> 今月
          </span>
          <span className="flex items-center gap-2">
            <span className="w-7 border-t-2 border-dashed border-muted-foreground" /> 前月
          </span>
        </div>
      </div>
      <div className="mt-2 h-36 w-full sm:mt-5 sm:h-64" aria-label="今月と前月の累積支出グラフ">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data.pace} margin={{ bottom: 0, left: -12, right: 4, top: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
            <XAxis
              axisLine={{ stroke: 'var(--border)' }}
              dataKey="day"
              interval="preserveStartEnd"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) => `${value}日`}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) => (value === 0 ? '0' : `${Math.round(value / 10000)}万`)}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<PaceTooltip />} />
            <Area
              dataKey="current"
              fill="var(--chart-1)"
              fillOpacity={0.08}
              isAnimationActive={false}
              name="今月"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="previous"
              dot={false}
              isAnimationActive={false}
              name="前月"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 5"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}

function CategoryRow({ category, index }: { category: CategorySummary; index: number }) {
  const Icon = categoryIcons[category.name] ?? Tags
  const differenceClass =
    category.difference > 0
      ? 'text-expense'
      : category.difference < 0
        ? 'text-chart-2'
        : 'text-muted-foreground'

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
      <span
        className={cn(
          'row-span-2 flex size-6 items-center justify-center rounded-full sm:size-9',
          categoryTones[index % categoryTones.length],
        )}
      >
        <Icon aria-hidden="true" className="size-3 sm:size-4.5" />
      </span>
      <span className="truncate text-xs font-medium leading-none sm:text-sm sm:leading-normal">
        {category.name}
      </span>
      <span className="text-xs font-semibold leading-none tabular-nums sm:text-sm sm:leading-normal">
        {formatCurrency(category.amount)}
      </span>
      <span className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted sm:mt-1 sm:h-1.5">
        <span
          className="block h-full rounded-full bg-chart-1"
          style={{ width: `${category.barRatio}%` }}
        />
      </span>
      <span
        className={cn(
          'text-[0.625rem] font-medium leading-none tabular-nums sm:mt-0.5 sm:text-xs sm:leading-normal',
          differenceClass,
        )}
      >
        {formatSignedCurrency(category.difference)}
      </span>
    </li>
  )
}

function CategoryCard({ data, month }: { data: HomeDashboardViewModel; month: string }) {
  return (
    <DashboardCard className="flex min-h-full flex-col">
      <h2 className="text-sm font-semibold sm:text-lg">
        カテゴリ別支出 <span className="text-[0.625rem] sm:text-xs">（上位5件）</span>
      </h2>
      {data.categories.length > 0 ? (
        <ul className="mt-2 space-y-1.5 sm:mt-5 sm:space-y-4">
          {data.categories.map((category, index) => (
            <CategoryRow category={category} index={index} key={category.name} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <Tags aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">この月の支出はありません</p>
        </div>
      )}
      <Button asChild className="mt-1 h-6 self-center text-xs text-primary sm:mt-5 sm:h-9 sm:text-sm" variant="link">
        <Link to={`/app/analysis?view=categories&month=${month}`}>
          すべて見る <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Link>
      </Button>
    </DashboardCard>
  )
}

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
    <div className={cn('rounded-xl p-2 sm:p-4', isIncrease ? 'bg-expense/6' : 'bg-chart-2/6')}>
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

function ChangesCard({ data }: { data: HomeDashboardViewModel }) {
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

function FixedSummaryCard({ data, month }: { data: HomeDashboardViewModel; month: string }) {
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
              className="block h-full rounded-full bg-chart-1"
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

function HomeDashboardSkeleton() {
  return (
    <div aria-label="ホーム画面を読み込んでいます" className="space-y-4" role="status">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <Skeleton className="h-[28rem] rounded-2xl" />
        <Skeleton className="h-[28rem] rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

export function HomeDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMonth = searchParams.get('month')
  const normalizedMonth = useMemo(() => normalizeMonthParam(rawMonth), [rawMonth])
  const month = useMemo(() => createMonthContext(normalizedMonth), [normalizedMonth])
  const dashboard = useHomeDashboard(month)

  useEffect(() => {
    if (rawMonth === normalizedMonth) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('month', normalizedMonth)
    setSearchParams(next, { replace: true })
  }, [normalizedMonth, rawMonth, searchParams, setSearchParams])

  const handleMonthChange = (value: string) => {
    if (!value) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('month', `${value}-01`)
    setSearchParams(next)
  }

  return (
    <section
      aria-labelledby="home-page-title"
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pb-24 pt-2 sm:px-6 sm:pt-6 md:px-8 md:pb-10 md:pt-8"
    >
      <MonthHeader
        maxMonth={month.currentMonthInput}
        monthInput={month.monthInput}
        monthLabel={month.monthLabel}
        onChange={handleMonthChange}
      />

      <div className="mt-2 sm:mt-6">
        {dashboard.isPending ? <HomeDashboardSkeleton /> : null}
        {dashboard.isError ? (
          <ErrorState
            message={
              dashboard.error instanceof Error
                ? dashboard.error.message
                : 'ホームのデータを取得できませんでした。'
            }
            onRetry={() => void dashboard.refetch()}
            title="ホームを表示できません"
          />
        ) : null}
        {dashboard.data ? (
          <div className="space-y-3 sm:space-y-4">
            <SummaryCard data={dashboard.data} />
            <SpendingPaceCard data={dashboard.data} />
            <div className="grid gap-3 min-[400px]:grid-cols-[1.08fr_0.92fr] sm:gap-4">
              <CategoryCard data={dashboard.data} month={month.month} />
              <ChangesCard data={dashboard.data} />
            </div>
            <FixedSummaryCard data={dashboard.data} month={month.month} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
