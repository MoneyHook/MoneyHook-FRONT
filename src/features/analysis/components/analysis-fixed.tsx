import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  LabelList,
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
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

import { useAnalysisFixed } from '../api/use-analysis-fixed'
import { analysisChartColors } from './analysis-chart-colors'
import {
  buildFixedBreakdown,
  normalizeFixedCategorySelection,
  normalizeFixedMetric,
  type AnalysisFixedViewModel,
  type FixedCategoryItem,
  type FixedMetric,
  type FixedTransactionItem,
} from '../model/analysis-fixed'
import {
  createAnalysisRange,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../model/analysis-overview'

function AnalysisPanel({
  children,
  className,
  id,
}: React.PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-6',
        className,
      )}
      id={id}
    >
      {children}
    </section>
  )
}

function PeriodPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-sm sm:min-h-20 sm:px-6 sm:py-3">
      <CalendarDays
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground sm:size-6"
      />
      <p className="min-w-0 text-sm font-medium tabular-nums sm:text-lg">
        {label}
      </p>
    </div>
  )
}

function CategoryIcon({ name }: { name: string }) {
  const presentation = getCategoryPresentation(name)
  const Icon = presentation.icon
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        presentation.iconClassName,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </span>
  )
}

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return '—'
  }
  if (value === 0) {
    return '±0.0%'
  }
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`
}

function FixedSummaryPanel({ data }: { data: AnalysisFixedViewModel }) {
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

function MetricToggle({
  value,
  onChange,
}: {
  value: FixedMetric
  onChange: (value: FixedMetric) => void
}) {
  return (
    <div
      aria-label="固定費内訳の表示形式"
      className="grid grid-cols-2 rounded-xl bg-muted p-1"
      role="group"
    >
      {(['amount', 'ratio'] as const).map((metric) => (
        <button
          aria-pressed={metric === value}
          className={cn(
            'min-h-10 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow] sm:min-h-9 sm:text-sm',
            metric === value
              ? 'bg-card text-success shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          key={metric}
          onClick={() => onChange(metric)}
          type="button"
        >
          {metric === 'amount' ? '金額' : '割合'}
        </button>
      ))}
    </div>
  )
}

function FixedDonut({
  categories,
  amount,
  filtered,
}: {
  categories: FixedCategoryItem[]
  amount: number
  filtered: boolean
}) {
  return (
    <div className="relative mx-auto size-36 sm:size-56">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={categories}
            dataKey="amount"
            innerRadius="57%"
            isAnimationActive
            nameKey="name"
            outerRadius="88%"
            paddingAngle={0.6}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {categories.map((category, index) => (
              <Cell
                fill={analysisChartColors[index % analysisChartColors.length]}
                key={category.id}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.625rem] text-muted-foreground sm:text-xs">
          {filtered ? '選択カテゴリ合計' : '固定費合計'}
        </span>
        <strong className="mt-0.5 text-sm font-semibold tabular-nums sm:text-xl">
          {formatCurrency(amount)}
        </strong>
      </div>
    </div>
  )
}

function FixedBreakdownPanel({
  data,
  selectedCategoryIds,
  metric,
  onMetricChange,
}: {
  data: AnalysisFixedViewModel
  selectedCategoryIds: string[]
  metric: FixedMetric
  onMetricChange: (metric: FixedMetric) => void
}) {
  const breakdown = buildFixedBreakdown(data, selectedCategoryIds)
  const filtered = selectedCategoryIds.length !== data.categories.length

  return (
    <AnalysisPanel>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold sm:text-lg">固定費の内訳</h2>
        <MetricToggle onChange={onMetricChange} value={metric} />
      </div>
      <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 min-[390px]:grid-cols-[9rem_minmax(0,1fr)] sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <FixedDonut
          amount={breakdown.amount}
          categories={breakdown.categories}
          filtered={filtered}
        />
        <ul className="min-w-0 space-y-0.5">
          {breakdown.categories.map((category, index) => (
            <li
              className="grid min-h-10 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5"
              key={category.id}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    analysisChartColors[index % analysisChartColors.length],
                }}
              />
              <CategoryIcon name={category.name} />
              <span className="min-w-0 text-[0.6875rem] font-semibold leading-4 sm:text-sm">
                {category.name}
              </span>
              <span className="min-w-16 text-right text-xs tabular-nums sm:min-w-24 sm:text-sm">
                <span
                  className={cn(
                    'block',
                    metric === 'amount'
                      ? 'font-semibold'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatCurrency(category.amount)}
                </span>
                <span
                  className={cn(
                    'block text-[0.625rem] sm:text-xs',
                    metric === 'ratio'
                      ? 'font-semibold text-success'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatPercent(category.ratio)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <a
        className="mt-4 flex min-h-11 items-center justify-between rounded-xl border px-4 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        href="#fixed-transactions"
      >
        固定費の取引一覧を見る
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </a>
    </AnalysisPanel>
  )
}

function TrendTooltip({
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
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{item.payload?.bucket}</p>
      <p className="mt-1 font-semibold tabular-nums">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

function formatAxisAmount(value: number) {
  if (value === 0) {
    return '¥0'
  }
  return `¥${Math.round(value / 10_000)}万`
}

function FixedTrendPanel({ data }: { data: AnalysisFixedViewModel }) {
  return (
    <AnalysisPanel>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold sm:text-lg">固定費の推移</h2>
        <span className="rounded-lg bg-muted px-3 py-2 text-xs font-medium sm:text-sm">
          月別
        </span>
      </div>
      <div
        aria-label="直近6か月の固定費推移グラフ"
        className="mt-4 h-52 w-full sm:h-72"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={data.series}
            margin={{ bottom: 0, left: 0, right: 28, top: 24 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={0}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              tickFormatter={(value) => formatAxisAmount(Number(value))}
              tickLine={false}
              width={46}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ stroke: 'var(--border)' }}
            />
            <Line
              activeDot={{ fill: analysisChartColors[0], r: 6, strokeWidth: 0 }}
              dataKey="expenseAmount"
              dot={{ fill: analysisChartColors[0], r: 4, strokeWidth: 0 }}
              isAnimationActive
              stroke={analysisChartColors[0]}
              strokeWidth={2.5}
              type="monotone"
            >
              <LabelList
                dataKey="expenseAmount"
                fill="var(--foreground)"
                fontSize={10}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                offset={10}
                position="top"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.series.every((item) => item.expenseAmount === 0) ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          この期間の固定費はありません
        </p>
      ) : null}
    </AnalysisPanel>
  )
}

function CategorySelector({
  categories,
  selectedCategoryIds,
  onChange,
}: {
  categories: FixedCategoryItem[]
  selectedCategoryIds: string[]
  onChange: (categoryIds: string[]) => void
}) {
  const selected = new Set(selectedCategoryIds)
  const allSelected = selectedCategoryIds.length === categories.length

  const toggleCategory = (categoryId: string) => {
    if (selected.has(categoryId)) {
      if (selectedCategoryIds.length === 1) {
        return
      }
      onChange(selectedCategoryIds.filter((id) => id !== categoryId))
      return
    }
    onChange(
      categories
        .filter(
          (category) =>
            selected.has(category.id) || category.id === categoryId,
        )
        .map((category) => category.id),
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`カテゴリを選択、${selectedCategoryIds.length}件選択中`}
          className="min-h-11 text-success sm:min-h-9"
          variant="ghost"
        >
          {allSelected
            ? 'カテゴリを選択'
            : `${selectedCategoryIds.length}カテゴリを選択中`}
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>表示するカテゴリ</DropdownMenuLabel>
        <DropdownMenuItem
          className="min-h-10"
          onSelect={() => onChange(categories.map((category) => category.id))}
        >
          すべて選択
          {allSelected ? <span className="ml-auto text-success">選択中</span> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((category) => {
          const checked = selected.has(category.id)
          return (
            <DropdownMenuCheckboxItem
              checked={checked}
              className="min-h-10"
              disabled={checked && selectedCategoryIds.length === 1}
              key={category.id}
              onCheckedChange={() => toggleCategory(category.id)}
              onSelect={(event) => event.preventDefault()}
            >
              <CategoryIcon name={category.name} />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCurrency(category.amount)}
              </span>
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CategoryTrendTable({
  data,
  categories,
  selectedCategoryIds,
  onCategoryChange,
}: {
  data: AnalysisFixedViewModel
  categories: FixedCategoryItem[]
  selectedCategoryIds: string[]
  onCategoryChange: (categoryIds: string[]) => void
}) {
  return (
    <AnalysisPanel className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          固定費のカテゴリ別推移
        </h2>
        <CategorySelector
          categories={data.categories}
          onChange={onCategoryChange}
          selectedCategoryIds={selectedCategoryIds}
        />
      </div>
      <div className="overflow-x-auto border-t">
        <table className="min-w-[52rem] w-full border-collapse text-xs tabular-nums sm:text-sm">
          <caption className="sr-only">
            選択した固定費カテゴリの月平均、月別支出、年間換算
          </caption>
          <thead className="bg-muted/45 text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 min-w-36 bg-muted px-4 py-3 text-left font-medium sm:px-6">
                カテゴリ
              </th>
              <th className="px-3 py-3 text-right font-medium">月平均</th>
              {data.series.map((item) => (
                <th
                  className="px-3 py-3 text-right font-medium"
                  key={item.bucket}
                >
                  {item.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium sm:px-6">
                年間換算
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((category) => {
              const byBucket = new Map(
                category.series.map((item) => [item.bucket, item.expenseAmount]),
              )
              return (
                <tr className="transition-colors hover:bg-muted/35" key={category.id}>
                  <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-semibold sm:px-6">
                    <span className="flex items-center gap-2">
                      <CategoryIcon name={category.name} />
                      <span>{category.name}</span>
                    </span>
                  </th>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatCurrency(category.monthlyAverage)}
                  </td>
                  {data.series.map((item) => (
                    <td className="px-3 py-3 text-right" key={item.bucket}>
                      {formatCurrency(byBucket.get(item.bucket) ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold sm:px-6">
                    {formatCurrency(category.annualizedAmount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AnalysisPanel>
  )
}

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function TransactionRow({ item }: { item: FixedTransactionItem }) {
  return (
    <li className="grid grid-cols-[minmax(5.8rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 text-left sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-2">
      <span className="text-[0.6875rem] font-medium sm:text-sm">
        {formatTransactionDate(item.date)}
      </span>
      <CategoryIcon name={item.categoryName} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-sm">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground sm:text-xs">
          {item.categoryName} · {item.subcategoryName}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-xs font-semibold text-expense tabular-nums sm:text-sm">
          {formatCurrency(item.amount)}
        </span>
        <span className="block text-[0.625rem] text-muted-foreground tabular-nums sm:text-xs">
          {item.time ? item.time.slice(0, 5) : item.paymentName ?? '—'}
        </span>
      </span>
    </li>
  )
}

function TransactionsPanel({ items }: { items: FixedTransactionItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? items : items.slice(0, 5)

  return (
    <AnalysisPanel className="scroll-mt-4 p-0" id="fixed-transactions">
      <div className="flex items-baseline justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">固定費の取引一覧</h2>
        <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
          {items.length}件
        </span>
      </div>
      {visibleItems.length > 0 ? (
        <ul className="divide-y border-t px-3 transition-[max-height] duration-200 sm:px-4">
          {visibleItems.map((transaction) => (
            <TransactionRow item={transaction} key={transaction.id} />
          ))}
        </ul>
      ) : (
        <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
          選択したカテゴリの固定費取引はありません
        </div>
      )}
      {items.length > 5 ? (
        <div className="border-t p-3 sm:p-4">
          <button
            aria-expanded={expanded}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? '最新5件に戻す' : `すべて表示（${items.length}件）`}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      ) : null}
    </AnalysisPanel>
  )
}

function FixedSkeleton() {
  return (
    <div
      aria-label="固定費分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

function EmptyFixed({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <PeriodPanel label={rangeLabel} />
      <AnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <WalletCards aria-hidden="true" className="size-8 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">この期間の固定費はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          固定費を記録すると月別の推移と年間換算を確認できます。
        </p>
      </AnalysisPanel>
    </div>
  )
}

export function AnalysisFixedContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMetric = searchParams.get('metric')
  const rawCategoryKey = searchParams.getAll('fixedCategory').join(',')
  const metric = normalizeFixedMetric(rawMetric)
  const range = useMemo(() => createAnalysisRange(), [])
  const fixed = useAnalysisFixed(range)
  const selectedCategoryIds = useMemo(
    () => {
      const rawCategoryIds = rawCategoryKey ? rawCategoryKey.split(',') : []
      return fixed.data
        ? normalizeFixedCategorySelection(fixed.data.categories, rawCategoryIds)
        : []
    },
    [fixed.data, rawCategoryKey],
  )

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (rawMetric && rawMetric !== metric) {
      next.delete('metric')
      changed = true
    }

    if (fixed.data) {
      const rawCategoryIds = rawCategoryKey ? rawCategoryKey.split(',') : []
      const allSelected =
        selectedCategoryIds.length === fixed.data.categories.length
      const expected = allSelected ? [] : selectedCategoryIds
      const matches =
        expected.length === rawCategoryIds.length &&
        expected.every((id, index) => id === rawCategoryIds[index])

      if (!matches) {
        next.delete('fixedCategory')
        expected.forEach((id) => next.append('fixedCategory', id))
        changed = true
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [
    fixed.data,
    metric,
    rawCategoryKey,
    rawMetric,
    searchParams,
    selectedCategoryIds,
    setSearchParams,
  ])

  const setMetric = (nextMetric: FixedMetric) => {
    const next = new URLSearchParams(searchParams)
    next.set('metric', nextMetric)
    setSearchParams(next)
  }

  const setCategories = (categoryIds: string[]) => {
    if (!fixed.data) {
      return
    }
    const selected = new Set(categoryIds)
    const orderedIds = fixed.data.categories
      .filter((category) => selected.has(category.id))
      .map((category) => category.id)
    const next = new URLSearchParams(searchParams)
    next.delete('fixedCategory')
    if (orderedIds.length !== fixed.data.categories.length) {
      orderedIds.forEach((id) => next.append('fixedCategory', id))
    }
    setSearchParams(next)
  }

  if (fixed.isPending) {
    return <FixedSkeleton />
  }

  if (fixed.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <PeriodPanel label={range.label} />
        <ErrorState
          message={
            fixed.error instanceof Error
              ? fixed.error.message
              : '固定費分析データを取得できませんでした。'
          }
          onRetry={() => void fixed.refetch()}
          title="固定費分析を表示できません"
        />
      </div>
    )
  }

  if (!fixed.data || fixed.data.categories.length === 0) {
    return <EmptyFixed rangeLabel={range.label} />
  }

  const selected = new Set(selectedCategoryIds)
  const selectedCategories = fixed.data.categories.filter((category) =>
    selected.has(category.id),
  )
  const selectedTransactions = fixed.data.transactions.filter((transaction) =>
    selected.has(transaction.categoryId),
  )

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <PeriodPanel label={fixed.data.range.label} />
      <FixedSummaryPanel data={fixed.data} />
      <FixedBreakdownPanel
        data={fixed.data}
        metric={metric}
        onMetricChange={setMetric}
        selectedCategoryIds={selectedCategoryIds}
      />
      <FixedTrendPanel data={fixed.data} />
      <CategoryTrendTable
        categories={selectedCategories}
        data={fixed.data}
        onCategoryChange={setCategories}
        selectedCategoryIds={selectedCategoryIds}
      />
      <TransactionsPanel items={selectedTransactions} />
    </div>
  )
}
