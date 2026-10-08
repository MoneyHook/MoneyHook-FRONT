import { ChevronDown } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { Button } from '@/shared/components/ui/button'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

import type {
  AnalysisCategoriesViewModel,
  CategoryAnalysisItem,
  CategoryListMode,
  CategorySummaryItem,
} from '../../model/analysis-categories'
import { formatCurrency, formatPercent } from '../../model/analysis-overview'
import { analysisChartColors } from '../analysis-chart-colors'
import { CategoryIcon } from '../category-icon'
import { CategoryAnalysisPanel } from './category-analysis-panel'

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
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
              borderRadius: 12,
              color: 'var(--popover-foreground)',
            }}
            formatter={(value) => formatCurrency(Number(value))}
            itemStyle={{ color: 'var(--popover-foreground)' }}
            wrapperStyle={{ zIndex: 50 }}
          />
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
      <span className="min-w-0 flex-1 text-left text-[0.6875rem] leading-4 font-semibold sm:text-sm">
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
      <Button
        variant="ghost"
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex h-auto min-h-10 w-full items-center justify-start gap-2 rounded-lg border-0 px-1.5 py-0 font-normal whitespace-normal transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 dark:hover:bg-muted',
          selected && presentation.selectionClassName,
        )}
        onClick={() => onSelect(item.id)}
        type="button"
      >
        {content}
      </Button>
    </li>
  )
}

export function CategorySummaryPanel({
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
    <CategoryAnalysisPanel id="category-summary">
      <h2 className="text-base font-semibold sm:text-lg">カテゴリ別支出</h2>
      <div className="mx-auto mt-4 grid max-w-4xl items-center gap-4 sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <CategoryDonut items={items} total={data.totalExpenseAmount} />
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
        <Button
          variant="ghost"
          aria-expanded={listMode === 'all'}
          className="mt-4 flex h-auto min-h-11 w-full items-center justify-between gap-0 rounded-xl border border-border px-4 py-0 text-left text-sm font-medium whitespace-normal transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 aria-expanded:bg-transparent dark:hover:bg-muted"
          onClick={() => onListModeChange(listMode === 'all' ? 'top' : 'all')}
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
        </Button>
      ) : null}
    </CategoryAnalysisPanel>
  )
}
