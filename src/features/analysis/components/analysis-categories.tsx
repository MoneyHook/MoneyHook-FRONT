import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Funnel,
  Tags,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

import { useAnalysisCategories } from '../api/use-analysis-categories'
import { analysisChartColors } from './analysis-chart-colors'
import {
  getSelectedCategory,
  normalizeCategoryUrlState,
  type AnalysisCategoriesViewModel,
  type CategoryAnalysisItem,
  type CategoryGroup,
  type CategoryListMode,
  type CategorySummaryItem,
  type CategoryTransactionItem,
  type SubcategoryAnalysisItem,
} from '../model/analysis-categories'
import {
  createAnalysisRange,
  formatCurrency,
  formatPercent,
} from '../model/analysis-overview'

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

function CategoryDonut({
  items,
  total,
}: {
  items: CategorySummaryItem[]
  total: number
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
                fill={analysisChartColors[index % analysisChartColors.length]}
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
          {formatCurrency(total)}
        </strong>
      </div>
    </div>
  )
}

function SummaryRow({
  item,
  index,
  selected,
  onSelect,
}: {
  item: CategorySummaryItem
  index: number
  selected: boolean
  onSelect: (categoryId: string) => void
}) {
  const presentation = getCategoryPresentation(item.name)
  const content = (
    <>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{
          backgroundColor:
            analysisChartColors[index % analysisChartColors.length],
        }}
      />
      <CategoryIcon name={item.name} />
      <span className="min-w-0 flex-1 text-left text-[0.6875rem] font-semibold leading-4 sm:text-sm">
        {item.name}
      </span>
      <span className="min-w-16 text-right text-xs tabular-nums sm:min-w-24 sm:text-sm">
        <span className="block font-semibold">
          {formatCurrency(item.amount)}
        </span>
        <span className="block text-[0.625rem] text-muted-foreground sm:text-xs">
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
          selected && presentation.selectionClassName,
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
  listMode,
  onListModeChange,
  onCategoryChange,
}: {
  data: AnalysisCategoriesViewModel
  selectedCategory: CategoryAnalysisItem
  listMode: CategoryListMode
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
      <h2 className="text-base font-semibold sm:text-lg">カテゴリ別支出</h2>
      <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 min-[390px]:grid-cols-[9rem_minmax(0,1fr)] sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <CategoryDonut
          items={items}
          total={data.totalExpenseAmount}
        />
        <ul className="min-w-0 space-y-0.5">
          {items.map((item, index) => (
            <SummaryRow
              index={index}
              item={item}
              key={item.id}
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
                fill={analysisChartColors[index % analysisChartColors.length]}
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
                analysisChartColors[index % analysisChartColors.length],
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
              activeDot={{ fill: analysisChartColors[0], r: 6, strokeWidth: 0 }}
              dataKey="expenseAmount"
              dot={{ fill: analysisChartColors[0], r: 4, strokeWidth: 0 }}
              isAnimationActive
              stroke={analysisChartColors[0]}
              strokeWidth={2.5}
              type="monotone"
            />
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
  onOpen,
}: {
  item: CategoryTransactionItem
  categoryName: string
  onOpen: (id: string) => void
}) {
  return (
    <button
      aria-label={`${item.name}を編集`}
      className="grid w-full grid-cols-[minmax(5.8rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 text-left outline-none transition-colors hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-2"
      onClick={() => onOpen(item.id)}
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

function TransactionsPanel({ category, onOpen }: { category: CategoryAnalysisItem; onOpen: (id: string) => void }) {
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
              onOpen={onOpen}
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
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawGroup = searchParams.get('group')
  const rawListMode = searchParams.get('list')
  const rawCategoryId = searchParams.get('category')
  const { group, listMode } = normalizeCategoryUrlState({
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
    if (searchParams.has('metric')) {
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
    rawCategoryId,
    rawGroup,
    rawListMode,
    searchParams,
    setSearchParams,
  ])

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(name, value)
    setSearchParams(next)
  }

  const openTransaction = (transactionId: string) => {
    navigate(`/app/transactions/${encodeURIComponent(transactionId)}/edit`, {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    })
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
        onCategoryChange={(categoryId) => setParam('category', categoryId)}
        onListModeChange={(mode) => setParam('list', mode)}
        selectedCategory={selectedCategory}
      />
      <SubcategoryPanel category={selectedCategory} />
      <TrendPanel
        category={selectedCategory}
        group={group}
        onGroupChange={(nextGroup) => setParam('group', nextGroup)}
      />
      <TransactionsPanel category={selectedCategory} onOpen={openTransaction} />
    </div>
  )
}
