import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analysisChartColors } from '../analysis-chart-colors'
import type { AnalysisFixedViewModel } from '../../model/analysis-fixed'
import { formatCurrency } from '../../model/analysis-overview'
import { AnalysisPanel } from './fixed-analysis-panel'

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

export function FixedTrendPanel({ data }: { data: AnalysisFixedViewModel }) {
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
            />
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
