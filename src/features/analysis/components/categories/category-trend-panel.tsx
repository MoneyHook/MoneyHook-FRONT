import { ChevronDown } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { CategoryAnalysisItem, CategoryGroup } from '../../model/analysis-categories'
import { formatCurrency } from '../../model/analysis-overview'
import { analysisChartColors } from '../analysis-chart-colors'
import { CategoryAnalysisPanel } from './category-analysis-panel'

const groupOptions: Array<{ value: CategoryGroup; label: string }> = [
  { value: 'month', label: '月別' },
  { value: 'week', label: '週別' },
  { value: 'day', label: '日別' },
]

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

export function CategoryTrendPanel({
  category,
  group,
  onGroupChange,
}: {
  category: CategoryAnalysisItem
  group: CategoryGroup
  onGroupChange: (group: CategoryGroup) => void
}) {
  return (
    <CategoryAnalysisPanel>
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
    </CategoryAnalysisPanel>
  )
}
