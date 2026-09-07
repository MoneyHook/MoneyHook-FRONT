import { ChevronRight } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { analysisChartColors } from '../analysis-chart-colors'
import {
  buildFixedBreakdown,
  type AnalysisFixedViewModel,
  type FixedCategoryItem,
} from '../../model/analysis-fixed'
import { formatCurrency, formatPercent } from '../../model/analysis-overview'
import { AnalysisPanel } from './fixed-analysis-panel'
import { CategoryIcon } from './category-icon'

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

export function FixedBreakdownPanel({
  data,
  selectedCategoryIds,
}: {
  data: AnalysisFixedViewModel
  selectedCategoryIds: string[]
}) {
  const breakdown = buildFixedBreakdown(data, selectedCategoryIds)
  const filtered = selectedCategoryIds.length !== data.categories.length

  return (
    <AnalysisPanel>
      <h2 className="text-base font-semibold sm:text-lg">固定費の内訳</h2>
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
                <span className="block font-semibold">
                  {formatCurrency(category.amount)}
                </span>
                <span
                  className="block text-[0.625rem] text-muted-foreground sm:text-xs"
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
