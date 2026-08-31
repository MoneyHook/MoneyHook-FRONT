import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartPie,
  Lightbulb,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ErrorState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import { useAnalysisOverview } from '../api/use-analysis-overview'
import { analysisChartColors } from './analysis-chart-colors'
import { AnalysisCategoriesContent } from './analysis-categories'
import { AnalysisFixedContent } from './analysis-fixed'
import { AnalysisPaymentsContent } from './analysis-payments'
import {
  createAnalysisRange,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  type AnalysisBreakdownItem,
  type AnalysisChangeItem,
  type AnalysisOverviewViewModel,
} from '../model/analysis-overview'

const analysisViews = [
  { value: 'overview', label: '概要' },
  { value: 'categories', label: 'カテゴリ' },
  { value: 'fixed', label: '固定費' },
  { value: 'payments', label: '支払い方法' },
] as const

type AnalysisView = (typeof analysisViews)[number]['value']

function normalizeView(value: string | null): AnalysisView {
  return analysisViews.some((view) => view.value === value)
    ? (value as AnalysisView)
    : 'overview'
}

function AnalysisHeader({ view }: { view: AnalysisView }) {
  const [searchParams] = useSearchParams()

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <h1
          className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl"
          id="analysis-page-title"
        >
          分析
        </h1>
        <span className="flex min-h-10 items-center gap-2 text-sm font-semibold text-primary sm:text-base">
          <CalendarDays aria-hidden="true" className="size-5" />
          直近6か月
        </span>
      </header>

      <nav aria-label="分析表示" className="mt-5 border-b sm:mt-7">
        <ul className="grid grid-cols-4">
          {analysisViews.map((item) => {
            const isActive = item.value === view
            const next = new URLSearchParams(searchParams)
            next.set('view', item.value)
            return (
              <li key={item.value}>
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-12 items-center justify-center px-1 text-center text-xs font-medium transition-colors sm:text-base',
                    isActive
                      ? 'text-primary after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                  to={{ search: `?${next.toString()}` }}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

function AnalysisPanel({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  )
}

function PeriodPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-sm sm:min-h-20 sm:px-6 sm:py-3">
      <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-muted-foreground sm:size-6" />
      <p className="min-w-0 text-sm font-medium tabular-nums sm:text-lg">{label}</p>
    </div>
  )
}

function SummaryPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel className="p-3 sm:p-6">
      <h2 className="text-sm font-semibold sm:text-lg">サマリー</h2>
      <div className="mt-3 grid grid-cols-3 divide-x sm:mt-6">
        <div className="min-w-0 pr-3 sm:pr-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">総支出</p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.expenseAmount)}
          </p>
          <p className="mt-1 truncate text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            月平均 {formatCurrency(data.monthlyAverageExpense)}
          </p>
        </div>
        <div className="min-w-0 px-3 sm:px-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">固定費</p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.fixedExpenseAmount)}
          </p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            {formatPercent(data.fixedExpenseRatio)}
          </p>
        </div>
        <div className="min-w-0 pl-3 sm:pl-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">変動費</p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.variableExpenseAmount)}
          </p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            {formatPercent(data.variableExpenseRatio)}
          </p>
        </div>
      </div>
    </AnalysisPanel>
  )
}

function SpendingTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: { bucket?: string }; value?: number }>
}) {
  const item = payload?.[0]
  if (!active || item?.value === undefined) {
    return null
  }

  const bucket = item.payload?.bucket ?? ''
  const [year, month] = bucket.split('-').map(Number)
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{year}年{month}月</p>
      <p className="mt-1 font-semibold tabular-nums">{formatCurrency(item.value)}</p>
    </div>
  )
}

function SpendingTrendPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel className="p-3 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold sm:text-lg">月別支出推移</h2>
        <span className="rounded-lg bg-muted px-3 py-2 text-xs font-medium sm:text-sm">支出</span>
      </div>
      <div
        aria-label="直近6か月の月別支出グラフ"
        className="mt-2 h-40 w-full sm:mt-6 sm:h-72"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.series} margin={{ bottom: 0, left: -2, right: 8, top: 20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) =>
                value === 0 ? '0' : `${Math.round(Number(value) / 10000)}万`
              }
              tickLine={false}
              width={48}
            />
            <Tooltip content={<SpendingTooltip />} cursor={{ stroke: 'var(--border)' }} />
            <Line
              activeDot={{ fill: analysisChartColors[0], r: 6, strokeWidth: 0 }}
              dataKey="expenseAmount"
              dot={{ fill: analysisChartColors[0], r: 4, strokeWidth: 0 }}
              isAnimationActive
              name="支出"
              stroke={analysisChartColors[0]}
              strokeWidth={2.5}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.expenseAmount === 0 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">この期間の支出はありません</p>
      ) : null}
    </AnalysisPanel>
  )
}

function BreakdownChart({
  items,
  label,
  colors,
}: {
  items: AnalysisBreakdownItem[]
  label: string
  colors: readonly string[]
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
        <ChartPie aria-hidden="true" className="size-8" />
        <p className="text-xs">該当する支出はありません</p>
      </div>
    )
  }

  return (
    <div className="grid min-h-28 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-1.5 sm:min-h-40 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <div aria-label={label} className="h-24 w-[4.5rem] sm:h-36 sm:w-32">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="amount"
              innerRadius="55%"
              isAnimationActive
              nameKey="name"
              outerRadius="86%"
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {items.map((item, index) => (
                <Cell fill={colors[index % colors.length]} key={item.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 space-y-1.5 sm:space-y-2.5">
        {items.map((item, index) => (
          <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 text-[0.625rem] sm:gap-x-2 sm:text-xs" key={item.name}>
            <span
              aria-hidden="true"
              className="mt-0.5 size-2 shrink-0 rounded-full sm:size-2.5"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="min-w-0">
              <span className="flex min-w-0 items-baseline gap-1">
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 font-normal text-muted-foreground tabular-nums">
                  {formatPercent(item.ratio)}
                </span>
              </span>
              <span className="block font-semibold tabular-nums sm:mt-0.5">
                {formatCurrency(item.amount)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BreakdownPanel({
  title,
  items,
  chartLabel,
  colors,
  linkLabel,
  linkView,
}: {
  title: string
  items: AnalysisBreakdownItem[]
  chartLabel: string
  colors: readonly string[]
  linkLabel: string
  linkView: AnalysisView
}) {
  return (
    <AnalysisPanel className="flex min-w-0 flex-col p-3 sm:p-6">
      <h2 className="text-sm font-semibold sm:text-lg">{title}</h2>
      <div className="mt-3 flex-1 sm:mt-5">
        <BreakdownChart colors={colors} items={items} label={chartLabel} />
      </div>
      <Link
        className="mt-3 flex min-h-11 items-center justify-between border-t pt-3 text-xs font-medium transition-colors hover:text-primary sm:text-sm"
        to={`/app/analysis?view=${linkView}`}
      >
        {linkLabel}
        <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </Link>
    </AnalysisPanel>
  )
}

function ChangeList({
  items,
  direction,
}: {
  items: AnalysisChangeItem[]
  direction: 'increase' | 'decrease'
}) {
  if (items.length === 0) {
    return <p className="py-5 text-center text-xs text-muted-foreground">該当する項目はありません</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          className="grid grid-cols-[3.5rem_minmax(2rem,1fr)_auto] items-center gap-2 text-[0.6875rem] sm:grid-cols-[6rem_minmax(4rem,1fr)_auto] sm:text-sm"
          key={item.name}
        >
          <span className="truncate font-medium">{item.name}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                'block h-full rounded-full',
                direction === 'increase' ? 'bg-expense' : 'bg-success',
              )}
              style={{ width: `${item.barRatio}%` }}
            />
          </span>
          <span className="text-right tabular-nums">
            <span className={cn('block font-semibold', direction === 'increase' ? 'text-expense' : 'text-success')}>
              {formatSignedCurrency(item.amount)}
            </span>
            <span className="block text-[0.625rem] text-muted-foreground">
              {item.rate === null ? '—' : formatSignedPercent(item.rate)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function formatSignedPercent(value: number) {
  if (value === 0) {
    return '±0.0%'
  }
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`
}

function ChangesPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel>
      <h2 className="text-sm font-semibold sm:text-lg">支出の増減（前期間比）</h2>
      <div className="mt-4 grid gap-4 min-[400px]:grid-cols-2 min-[400px]:divide-x sm:mt-5 sm:gap-5">
        <div className="min-[400px]:pr-3 sm:pr-6">
          <p className="mb-3 text-xs font-medium text-muted-foreground">増加したカテゴリ</p>
          <ChangeList direction="increase" items={data.increases} />
        </div>
        <div className="min-[400px]:pl-3 sm:pl-6">
          <p className="mb-3 text-xs font-medium text-muted-foreground">減少したカテゴリ</p>
          <ChangeList direction="decrease" items={data.decreases} />
        </div>
      </div>
    </AnalysisPanel>
  )
}

function OverallHighlight({ data }: { data: AnalysisOverviewViewModel }) {
  const isIncrease = data.differenceAmount > 0
  const isDecrease = data.differenceAmount < 0
  const Icon = isIncrease ? ArrowUpRight : isDecrease ? ArrowDownRight : ArrowRight

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-background p-3 sm:p-4">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          isIncrease
            ? 'bg-expense/10 text-expense'
            : isDecrease
              ? 'bg-success/10 text-success'
              : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 sm:text-sm">
          支出は前期間より {formatCurrency(data.differenceAmount)}
          {isIncrease ? ' 増加しました' : isDecrease ? ' 減少しました' : 'で変化はありません'}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground sm:text-xs">
          {data.differenceRate === null
            ? '比較期間の支出がないため増減率は算出できません'
            : `前期間比 ${formatSignedPercent(data.differenceRate)}`}
        </p>
      </div>
    </div>
  )
}

function FixedHighlight({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-background p-3 sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
        <Lightbulb aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 sm:text-sm">
          固定費の割合は {formatPercent(data.fixedExpenseRatio)} でした
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground sm:text-xs">
          直近月の固定費は前月比 {formatSignedCurrency(data.latestFixedDifferenceAmount)}
          {data.latestFixedDifferenceRate === null
            ? ''
            : `（${formatSignedPercent(data.latestFixedDifferenceRate)}）`}
        </p>
      </div>
    </div>
  )
}

function HighlightsPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel>
      <h2 className="text-sm font-semibold sm:text-lg">今月のハイライト</h2>
      <div className="mt-4 grid gap-3 min-[400px]:grid-cols-2">
        <OverallHighlight data={data} />
        <FixedHighlight data={data} />
      </div>
    </AnalysisPanel>
  )
}

function OverviewSkeleton() {
  return (
    <div aria-label="分析概要を読み込んでいます" className="space-y-4" role="status">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}

function OverviewContent() {
  const range = useMemo(() => createAnalysisRange(), [])
  const overview = useAnalysisOverview(range)

  if (overview.isPending) {
    return <OverviewSkeleton />
  }

  if (overview.isError) {
    return (
      <>
        <PeriodPanel label={range.label} />
        <ErrorState
          message={
            overview.error instanceof Error
              ? overview.error.message
              : '分析データを取得できませんでした。'
          }
          onRetry={() => void overview.refetch()}
          title="分析を表示できません"
        />
      </>
    )
  }

  if (!overview.data) {
    return null
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <PeriodPanel label={overview.data.range.label} />
      <SummaryPanel data={overview.data} />
      <SpendingTrendPanel data={overview.data} />
      <div className="grid gap-3 min-[400px]:grid-cols-2 sm:gap-4">
        <BreakdownPanel
          chartLabel="カテゴリ別支出の割合"
          colors={analysisChartColors}
          items={overview.data.categories}
          linkLabel="すべてのカテゴリを見る"
          linkView="categories"
          title="カテゴリ別支出（上位5件）"
        />
        <BreakdownPanel
          chartLabel="固定費カテゴリの割合"
          colors={analysisChartColors}
          items={overview.data.fixedCategories}
          linkLabel="固定費の詳細を見る"
          linkView="fixed"
          title="固定費の内訳"
        />
      </div>
      <ChangesPanel data={overview.data} />
      <HighlightsPanel data={overview.data} />
    </div>
  )
}

export function AnalysisDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view = normalizeView(rawView)

  useEffect(() => {
    if (rawView === null || rawView === view) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('view', view)
    setSearchParams(next, { replace: true })
  }, [rawView, searchParams, setSearchParams, view])

  return (
    <section
      aria-labelledby="analysis-page-title"
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8 md:px-8 md:pb-10"
    >
      <AnalysisHeader view={view} />
      <div className="mt-5 sm:mt-6">
        {view === 'overview' ? <OverviewContent /> : null}
        {view === 'categories' ? <AnalysisCategoriesContent /> : null}
        {view === 'fixed' ? <AnalysisFixedContent /> : null}
        {view === 'payments' ? <AnalysisPaymentsContent /> : null}
      </div>
    </section>
  )
}
