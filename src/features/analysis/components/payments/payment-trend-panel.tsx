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
import type { AnalysisPaymentsViewModel } from '../../model/analysis-payments'
import { formatCurrency } from '../../model/analysis-overview'
import { AnalysisPanel } from './payments-analysis-panel'

type PaymentTrendRow = {
  bucket: string
  label: string
} & Record<string, string | number>

function buildTrendRows(data: AnalysisPaymentsViewModel): PaymentTrendRow[] {
  const buckets = new Map<string, PaymentTrendRow>()
  data.payments.forEach((payment) => {
    payment.series.forEach((item) => {
      const row = buckets.get(item.bucket) ?? {
        bucket: item.bucket,
        label: item.label,
      }
      row[payment.id] = item.expenseAmount
      buckets.set(item.bucket, row)
    })
  })
  return [...buckets.values()].sort((left, right) =>
    left.bucket.localeCompare(right.bucket),
  )
}

function formatAxisAmount(value: number) {
  if (value === 0) {
    return '¥0'
  }
  return `¥${Math.round(value / 10_000)}万`
}

function PaymentTrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    color?: string
    name?: string
    value?: number
    payload?: { label?: string }
  }>
}) {
  const visible = payload?.filter((item) => item.value !== undefined) ?? []
  if (!active || visible.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{visible[0].payload?.label}</p>
      <ul className="mt-1.5 space-y-1">
        {visible.map((item) => (
          <li className="flex items-center justify-between gap-5" key={item.name}>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(item.value ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PaymentTrendPanel({ data }: { data: AnalysisPaymentsViewModel }) {
  const rows = buildTrendRows(data)

  return (
    <AnalysisPanel>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold sm:text-lg">
          支払い方法別の支出推移
        </h2>
        <span className="rounded-lg bg-muted px-3 py-2 text-xs font-medium sm:text-sm">
          月別
        </span>
      </div>
      <div
        aria-label="直近6か月の支払い方法別支出推移グラフ"
        className="mt-4 h-56 w-full sm:h-72"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={rows}
            margin={{ bottom: 0, left: 0, right: 14, top: 18 }}
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
              width={48}
            />
            <Tooltip
              content={<PaymentTrendTooltip />}
              cursor={{ stroke: 'var(--border)' }}
            />
            {data.payments.map((payment, index) => (
              <Line
                activeDot={{
                  fill: analysisChartColors[index % analysisChartColors.length],
                  r: 5,
                  strokeWidth: 0,
                }}
                dataKey={payment.id}
                dot={{
                  fill: analysisChartColors[index % analysisChartColors.length],
                  r: 3.5,
                  strokeWidth: 0,
                }}
                isAnimationActive
                key={payment.id}
                name={payment.name}
                stroke={analysisChartColors[index % analysisChartColors.length]}
                strokeWidth={2.25}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul
        aria-label="支払い方法別支出推移の凡例"
        className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[0.6875rem] sm:text-xs"
      >
        {data.payments.map((payment, index) => (
          <li className="flex items-center gap-1.5" key={payment.id}>
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{
                backgroundColor:
                  analysisChartColors[index % analysisChartColors.length],
              }}
            />
            {payment.name}
          </li>
        ))}
      </ul>
    </AnalysisPanel>
  )
}
