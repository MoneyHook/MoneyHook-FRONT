import { ChevronRight } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { analysisChartColors } from '../analysis-chart-colors'
import type { AnalysisPaymentsViewModel } from '../../model/analysis-payments'
import { formatCurrency, formatPercent } from '../../model/analysis-overview'
import { AnalysisPanel } from './payments-analysis-panel'
import { PaymentIcon } from './payment-icon'

function PaymentDonut({ data }: { data: AnalysisPaymentsViewModel }) {
  return (
    <div className="relative mx-auto size-36 sm:size-56">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={data.payments}
            dataKey="amount"
            innerRadius="57%"
            isAnimationActive
            nameKey="name"
            outerRadius="89%"
            paddingAngle={0.6}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.payments.map((payment, index) => (
              <Cell
                fill={analysisChartColors[index % analysisChartColors.length]}
                key={payment.id}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.625rem] text-muted-foreground sm:text-xs">
          総支出
        </span>
        <strong className="mt-0.5 text-sm font-semibold tracking-tight tabular-nums sm:text-xl">
          {formatCurrency(data.totalExpenseAmount)}
        </strong>
      </div>
    </div>
  )
}

export function PaymentSummaryPanel({
  data,
}: {
  data: AnalysisPaymentsViewModel
}) {
  return (
    <AnalysisPanel>
      <h2 className="text-base font-semibold sm:text-lg">支払い方法サマリー</h2>
      <div className="mx-auto mt-4 grid max-w-4xl grid-cols-[9rem_minmax(0,1fr)] items-center gap-3 sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <PaymentDonut data={data} />
        <ul className="min-w-0 space-y-1 sm:space-y-2">
          {data.payments.map((payment, index) => (
            <li
              className="grid min-h-10 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg"
              key={payment.id}
            >
              <PaymentIcon index={index} payment={payment} />
              <span className="min-w-0 truncate text-[0.6875rem] font-semibold sm:text-sm">
                {payment.name}
              </span>
              <span className="text-right text-[0.6875rem] tabular-nums sm:text-sm">
                <span className="block font-semibold">
                  {formatCurrency(payment.amount)}
                </span>
                <span className="block text-[0.625rem] text-muted-foreground sm:text-xs">
                  {formatPercent(payment.ratio)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <a
        className="mt-4 flex min-h-11 items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        href="#payment-details"
      >
        支払い方法の取引一覧を見る
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </a>
    </AnalysisPanel>
  )
}
