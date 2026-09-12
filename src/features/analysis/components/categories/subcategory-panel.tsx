import { Tags } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type {
  CategoryAnalysisItem,
  SubcategoryAnalysisItem,
} from '../../model/analysis-categories'
import { formatCurrency, formatPercent } from '../../model/analysis-overview'
import { analysisChartColors } from '../analysis-chart-colors'
import { CategoryAnalysisPanel } from './category-analysis-panel'

function SubcategoryDonut({ category }: { category: CategoryAnalysisItem }) {
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

export function SubcategoryPanel({
  category,
}: {
  category: CategoryAnalysisItem
}) {
  return (
    <CategoryAnalysisPanel>
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
    </CategoryAnalysisPanel>
  )
}
