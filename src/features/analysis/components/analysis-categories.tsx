import {
  CalendarDays,
  Cross,
  ChevronDown,
  ChevronRight,
  Coffee,
  Funnel,
  GraduationCap,
  House,
  Lightbulb,
  MoreHorizontal,
  ShoppingBag,
  Shirt,
  Smartphone,
  Tags,
  Ticket,
  TrainFront,
  Utensils,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
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
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import { useAnalysisCategories } from '../api/use-analysis-categories'
import {
  getSelectedCategory,
  normalizeCategoryUrlState,
  type AnalysisCategoriesViewModel,
  type CategoryAnalysisItem,
  type CategoryGroup,
  type CategoryListMode,
  type CategoryMetric,
  type CategorySummaryItem,
  type CategoryTransactionItem,
  type SubcategoryAnalysisItem,
} from '../model/analysis-categories'
import {
  createAnalysisRange,
  formatCurrency,
  formatPercent,
} from '../model/analysis-overview'

const categoryColors = [
  'var(--warning)',
  'var(--success)',
  'var(--chart-2)',
  'var(--chart-5)',
  'var(--chart-3)',
  'var(--muted-foreground)',
]

const subcategoryColors = [
  'var(--analysis-subcategory-1)',
  'var(--analysis-subcategory-2)',
  'var(--analysis-subcategory-3)',
  'var(--analysis-subcategory-4)',
  'var(--analysis-subcategory-5)',
]

type CategoryPresentation = {
  icon: LucideIcon
  className: string
}

const defaultPresentation: CategoryPresentation = {
  icon: Tags,
  className: 'bg-muted text-muted-foreground',
}

const categoryPresentations: Record<string, CategoryPresentation> = {
  食費: { icon: Utensils, className: 'bg-warning/12 text-warning' },
  住居: { icon: House, className: 'bg-success/12 text-success' },
  住宅: { icon: House, className: 'bg-success/12 text-success' },
  交通: { icon: TrainFront, className: 'bg-chart-2/12 text-chart-2' },
  娯楽: { icon: Ticket, className: 'bg-chart-5/12 text-chart-5' },
  日用品: { icon: ShoppingBag, className: 'bg-chart-3/12 text-chart-3' },
  ショッピング: {
    icon: ShoppingBag,
    className: 'bg-chart-3/12 text-chart-3',
  },
  水道光熱費: { icon: Lightbulb, className: 'bg-warning/12 text-warning' },
  通信費: { icon: Smartphone, className: 'bg-chart-2/12 text-chart-2' },
  医療: { icon: Cross, className: 'bg-expense/12 text-expense' },
  衣服: { icon: Shirt, className: 'bg-chart-5/12 text-chart-5' },
  教育: { icon: GraduationCap, className: 'bg-chart-2/12 text-chart-2' },
  交際費: { icon: Users, className: 'bg-success/12 text-success' },
  その他: { icon: MoreHorizontal, className: 'bg-muted text-muted-foreground' },
  カフェ: { icon: Coffee, className: 'bg-warning/12 text-warning' },
}

const groupOptions: Array<{ value: CategoryGroup; label: string }> = [
  { value: 'month', label: '月別' },
  { value: 'week', label: '週別' },
  { value: 'day', label: '日別' },
]

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
  const presentation = categoryPresentations[name] ?? defaultPresentation
  const Icon = presentation.icon
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        presentation.className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </span>
  )
}

function MetricToggle({
  value,
  onChange,
}: {
  value: CategoryMetric
  onChange: (value: CategoryMetric) => void
}) {
  return (
    <div
      aria-label="カテゴリ集計の表示形式"
      className="grid grid-cols-2 rounded-xl bg-muted p-1"
      role="group"
    >
      {(['amount', 'ratio'] as const).map((metric) => {
        const isActive = metric === value
        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'min-h-8 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow] sm:text-sm',
              isActive
                ? 'bg-card text-success shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            key={metric}
            onClick={() => onChange(metric)}
            type="button"
          >
            {metric === 'amount' ? '金額' : '割合'}
          </button>
        )
      })}
    </div>
  )
}

function CategoryDonut({
  items,
  total,
  metric,
}: {
  items: CategorySummaryItem[]
  total: number
  metric: CategoryMetric
}) {
  return (
    <div className="relative mx-auto size-36 sm:size-56">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="amount"
            innerRadius="57%"
            isAnimationActive
            nameKey="name"
            outerRadius="88%"
            paddingAngle={0.6}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {items.map((item, index) => (
              <Cell
                fill={categoryColors[index % categoryColors.length]}
                key={item.id}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.6875rem] text-muted-foreground sm:text-sm">
          総支出
        </span>
        <strong className="mt-0.5 text-sm font-semibold tabular-nums sm:text-xl">
          {metric === 'amount' ? formatCurrency(total) : '100.0%'}
        </strong>
      </div>
    </div>
  )
}

function SummaryRow({
  item,
  index,
  metric,
  selected,
  onSelect,
}: {
  item: CategorySummaryItem
  index: number
  metric: CategoryMetric
  selected: boolean
  onSelect: (categoryId: string) => void
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
      />
      <CategoryIcon name={item.name} />
      <span className="min-w-0 flex-1 text-left text-[0.6875rem] font-semibold leading-4 sm:text-sm">
        {item.name}
      </span>
      <span className="min-w-16 text-right text-xs tabular-nums sm:min-w-24 sm:text-sm">
        <span
          className={cn(
            'block',
            metric === 'amount' ? 'font-semibold' : 'text-muted-foreground',
          )}
        >
          {formatCurrency(item.amount)}
        </span>
        <span
          className={cn(
            'block text-[0.625rem] sm:text-xs',
            metric === 'ratio'
              ? 'font-semibold text-success'
              : 'text-muted-foreground',
          )}
        >
          {formatPercent(item.ratio)}
        </span>
      </span>
    </>
  )

  if (!item.selectable) {
    return (
      <li className="flex min-h-10 items-center gap-2 rounded-lg px-1.5">
        {content}
      </li>
    )
  }

  return (
    <li>
      <button
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-10 w-full items-center gap-2 rounded-lg px-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          selected && 'bg-success/10',
        )}
        onClick={() => onSelect(item.id)}
        type="button"
      >
        {content}
      </button>
    </li>
  )
}

function CategorySummaryPanel({
  data,
  selectedCategory,
  metric,
  listMode,
  onMetricChange,
  onListModeChange,
  onCategoryChange,
}: {
  data: AnalysisCategoriesViewModel
  selectedCategory: CategoryAnalysisItem
  metric: CategoryMetric
  listMode: CategoryListMode
  onMetricChange: (metric: CategoryMetric) => void
  onListModeChange: (mode: CategoryListMode) => void
  onCategoryChange: (categoryId: string) => void
}) {
  const items: CategorySummaryItem[] =
    listMode === 'all'
      ? data.categories.map((category) => ({
          id: category.id,
          name: category.name,
          amount: category.amount,
          ratio: category.ratio,
          selectable: true,
        }))
      : data.topCategories

  return (
    <AnalysisPanel id="category-summary">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold sm:text-lg">カテゴリ別支出</h2>
        <MetricToggle onChange={onMetricChange} value={metric} />
      </div>
      <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 min-[390px]:grid-cols-[9rem_minmax(0,1fr)] sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <CategoryDonut
          items={items}
          metric={metric}
          total={data.totalExpenseAmount}
        />
        <ul className="min-w-0 space-y-0.5">
          {items.map((item, index) => (
            <SummaryRow
              index={index}
              item={item}
              key={item.id}
              metric={metric}
              onSelect={onCategoryChange}
              selected={item.id === selectedCategory.id}
            />
          ))}
        </ul>
      </div>
      {data.categories.length > 5 ? (
        <button
          aria-expanded={listMode === 'all'}
          className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() =>
            onListModeChange(listMode === 'all' ? 'top' : 'all')
          }
          type="button"
        >
          {listMode === 'all'
            ? '上位カテゴリだけを表示'
            : 'すべてのカテゴリを表示'}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              listMode === 'all' && 'rotate-180',
            )}
          />
        </button>
      ) : null}
    </AnalysisPanel>
  )
}

function SubcategoryDonut({
  category,
}: {
  category: CategoryAnalysisItem
}) {
  if (category.subcategories.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
        <Tags aria-hidden="true" className="size-7" />
        <p className="mt-2 text-xs">サブカテゴリの支出はありません</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto h-40 w-40 sm:h-52 sm:w-52">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={category.subcategories}
            dataKey="amount"
            innerRadius="56%"
            isAnimationActive
            nameKey="name"
            outerRadius="88%"
            paddingAngle={0.7}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {category.subcategories.map((item, index) => (
              <Cell
                fill={subcategoryColors[index % subcategoryColors.length]}
                key={item.id}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.625rem] text-muted-foreground sm:text-xs">
          {category.name}合計
        </span>
        <strong className="mt-0.5 text-sm font-semibold tabular-nums sm:text-lg">
          {formatCurrency(category.amount)}
        </strong>
      </div>
    </div>
  )
}

function SubcategoryList({ items }: { items: SubcategoryAnalysisItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        サブカテゴリの支出はありません
      </p>
    )
  }

  return (
    <ul className="space-y-2 sm:space-y-3">
      {items.map((item, index) => (
        <li
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs sm:text-sm"
          key={item.id}
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{
              backgroundColor:
                subcategoryColors[index % subcategoryColors.length],
            }}
          />
          <span className="truncate font-medium">{item.name}</span>
          <span className="text-right tabular-nums">
            <span className="block font-semibold">
              {formatCurrency(item.amount)}
            </span>
            <span className="block text-[0.625rem] text-muted-foreground sm:text-xs">
              {formatPercent(item.ratio)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function SubcategoryPanel({ category }: { category: CategoryAnalysisItem }) {
  return (
    <AnalysisPanel>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold sm:text-lg">
          {category.name}の内訳
        </h2>
        <strong className="text-base font-semibold tabular-nums sm:text-xl">
          {formatCurrency(category.amount)}
        </strong>
      </div>
      <div className="mt-5 grid items-center gap-5 min-[390px]:grid-cols-[minmax(0,1fr)_10rem] sm:grid-cols-[minmax(0,1fr)_14rem] sm:gap-10">
        <SubcategoryList items={category.subcategories} />
        <SubcategoryDonut category={category} />
      </div>
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

function TrendPanel({
  category,
  group,
  onGroupChange,
}: {
  category: CategoryAnalysisItem
  group: CategoryGroup
  onGroupChange: (group: CategoryGroup) => void
}) {
  return (
    <AnalysisPanel>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold sm:text-lg">
          {category.name}の推移
        </h2>
        <label className="relative inline-flex min-h-9 items-center rounded-lg bg-muted text-xs font-medium sm:text-sm">
          <select
            aria-label="推移の集計単位"
            className="h-9 appearance-none bg-transparent pl-3 pr-9 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) =>
              onGroupChange(event.target.value as CategoryGroup)
            }
            value={group}
          >
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 size-4"
          />
        </label>
      </div>
      <div
        aria-label={`${category.name}の支出推移グラフ`}
        className="mt-4 h-52 w-full sm:h-72"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={category.series}
            margin={{
              bottom: 0,
              left: 0,
              right: group === 'month' ? 28 : 10,
              top: group === 'month' ? 24 : 10,
            }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={group === 'day' ? 'preserveStartEnd' : 0}
              minTickGap={20}
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
              activeDot={{ fill: 'var(--success)', r: 6, strokeWidth: 0 }}
              dataKey="expenseAmount"
              dot={{ fill: 'var(--success)', r: 4, strokeWidth: 0 }}
              isAnimationActive
              stroke="var(--success)"
              strokeWidth={2.5}
              type="monotone"
            >
              {group === 'month' ? (
                <LabelList
                  dataKey="expenseAmount"
                  fill="var(--foreground)"
                  fontSize={10}
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  offset={10}
                  position="top"
                />
              ) : null}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      {category.series.every((item) => item.expenseAmount === 0) ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          この期間の支出はありません
        </p>
      ) : null}
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

function TransactionRow({
  item,
  categoryName,
}: {
  item: CategoryTransactionItem
  categoryName: string
}) {
  return (
    <button
      aria-label={`${item.name}の取引詳細（準備中）`}
      className="grid w-full grid-cols-[minmax(5.8rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 text-left disabled:cursor-default disabled:opacity-100 sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-2"
      disabled
      title="取引詳細は準備中です"
      type="button"
    >
      <span className="text-[0.6875rem] font-medium sm:text-sm">
        {formatTransactionDate(item.date)}
      </span>
      <CategoryIcon name={categoryName} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-sm">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground sm:text-xs">
          {item.subcategoryName}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {item.paymentName ? (
          <span className="hidden max-w-24 truncate rounded-md bg-muted px-2 py-1 text-[0.625rem] text-muted-foreground min-[390px]:block sm:text-xs">
            {item.paymentName}
          </span>
        ) : null}
        <span className="text-right">
          <span className="block text-xs font-semibold text-expense tabular-nums sm:text-sm">
            {formatCurrency(item.amount)}
          </span>
          {item.time ? (
            <span className="block text-[0.625rem] text-muted-foreground tabular-nums sm:text-xs">
              {item.time.slice(0, 5)}
            </span>
          ) : null}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </span>
    </button>
  )
}

function TransactionsPanel({ category }: { category: CategoryAnalysisItem }) {
  const transactions = category.transactions.slice(0, 3)
  return (
    <AnalysisPanel className="p-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          {category.name}の取引一覧
        </h2>
        <Button
          aria-label="取引を絞り込み（準備中）"
          className="text-success disabled:opacity-100"
          disabled
          size="sm"
          title="絞り込みは準備中です"
          variant="ghost"
        >
          絞り込み
          <Funnel aria-hidden="true" />
        </Button>
      </div>
      {transactions.length > 0 ? (
        <div className="divide-y border-t px-3 sm:px-4">
          {transactions.map((transaction) => (
            <TransactionRow
              categoryName={category.name}
              item={transaction}
              key={transaction.id}
            />
          ))}
        </div>
      ) : (
        <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
          このカテゴリの取引はありません
        </div>
      )}
      <div className="border-t p-3 sm:p-4">
        <button
          aria-label={`${category.name}のすべての取引を表示（準備中）`}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium text-muted-foreground disabled:cursor-default"
          disabled
          title="取引一覧との連携は準備中です"
          type="button"
        >
          {category.name}のすべての取引を表示
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </AnalysisPanel>
  )
}

function CategoriesSkeleton() {
  return (
    <div
      aria-label="カテゴリ分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

function EmptyCategories({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <PeriodPanel label={rangeLabel} />
      <AnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <Tags aria-hidden="true" className="size-8 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">この期間の支出はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          支出を記録するとカテゴリ別の傾向を確認できます。
        </p>
      </AnalysisPanel>
    </div>
  )
}

export function AnalysisCategoriesContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMetric = searchParams.get('metric')
  const rawGroup = searchParams.get('group')
  const rawListMode = searchParams.get('list')
  const rawCategoryId = searchParams.get('category')
  const { metric, group, listMode } = normalizeCategoryUrlState({
    metric: rawMetric,
    group: rawGroup,
    listMode: rawListMode,
  })
  const range = useMemo(() => createAnalysisRange(), [])
  const categories = useAnalysisCategories(range, group)
  const selectedCategory = categories.data
    ? getSelectedCategory(categories.data, rawCategoryId)
    : null

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    if (rawMetric && rawMetric !== metric) {
      next.delete('metric')
      changed = true
    }
    if (rawGroup && rawGroup !== group) {
      next.delete('group')
      changed = true
    }
    if (rawListMode && rawListMode !== listMode) {
      next.delete('list')
      changed = true
    }
    if (
      rawCategoryId &&
      categories.data &&
      !categories.data.categories.some(
        (category) => category.id === rawCategoryId,
      )
    ) {
      next.delete('category')
      changed = true
    }
    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [
    categories.data,
    group,
    listMode,
    metric,
    rawCategoryId,
    rawGroup,
    rawListMode,
    rawMetric,
    searchParams,
    setSearchParams,
  ])

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(name, value)
    setSearchParams(next)
  }

  if (categories.isPending) {
    return <CategoriesSkeleton />
  }

  if (categories.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <PeriodPanel label={range.label} />
        <ErrorState
          message={
            categories.error instanceof Error
              ? categories.error.message
              : 'カテゴリ分析データを取得できませんでした。'
          }
          onRetry={() => void categories.refetch()}
          title="カテゴリ分析を表示できません"
        />
      </div>
    )
  }

  if (!categories.data || !selectedCategory) {
    return <EmptyCategories rangeLabel={range.label} />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <PeriodPanel label={categories.data.range.label} />
      <CategorySummaryPanel
        data={categories.data}
        listMode={listMode}
        metric={metric}
        onCategoryChange={(categoryId) => setParam('category', categoryId)}
        onListModeChange={(mode) => setParam('list', mode)}
        onMetricChange={(nextMetric) => setParam('metric', nextMetric)}
        selectedCategory={selectedCategory}
      />
      <SubcategoryPanel category={selectedCategory} />
      <TrendPanel
        category={selectedCategory}
        group={group}
        onGroupChange={(nextGroup) => setParam('group', nextGroup)}
      />
      <TransactionsPanel category={selectedCategory} />
    </div>
  )
}
