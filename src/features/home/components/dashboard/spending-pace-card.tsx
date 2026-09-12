import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatCurrency,
  type HomeDashboardViewModel,
} from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

function PaceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; dataKey?: string }>
  label?: number
}) {
  if (!active || !payload?.length) {
    return null
  }
  const current = payload.find((item) => item.dataKey === 'current')?.value
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p>{label}日</p>
      <p className="mt-1 font-semibold tabular-nums">
        {current === undefined ? 'データなし' : formatCurrency(current)}
      </p>
    </div>
  )
}

export function SpendingPaceCard({ data }: { data: HomeDashboardViewModel }) {
  return (
    <DashboardCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold sm:text-lg">
          支出ペース <span className="ml-1 text-xs">（累計）</span>
        </h2>
        <div className="flex items-center gap-5 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-7 rounded-full"
              style={{ backgroundColor: 'var(--chart-series-1)' }}
            />{' '}
            今月
          </span>
          <span className="flex items-center gap-2">
            <span className="w-7 border-t-2 border-dashed border-muted-foreground" />{' '}
            前月
          </span>
        </div>
      </div>
      <div
        className="mt-2 h-36 w-full sm:mt-5 sm:h-64"
        aria-label="今月と前月の累積支出グラフ"
      >
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data.pace}
            margin={{ bottom: 0, left: -12, right: 4, top: 8 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              axisLine={{ stroke: 'var(--border)' }}
              dataKey="day"
              interval="preserveStartEnd"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) => `${value}日`}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) =>
                value === 0 ? '0' : `${Math.round(value / 10000)}万`
              }
              tickLine={false}
              width={42}
            />
            <Tooltip content={<PaceTooltip />} />
            <Area
              dataKey="current"
              fill="var(--chart-series-1)"
              fillOpacity={0.08}
              isAnimationActive={false}
              name="今月"
              stroke="var(--chart-series-1)"
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="previous"
              dot={false}
              isAnimationActive={false}
              name="前月"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 5"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}
