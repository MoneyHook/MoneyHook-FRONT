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
import { formatCurrency, type AnalysisOverviewViewModel } from '../../model/analysis-overview'
import { AnalysisPanel } from './overview-analysis-panel'

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

export function SpendingTrendPanel({ data }: { data: AnalysisOverviewViewModel }) {
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
