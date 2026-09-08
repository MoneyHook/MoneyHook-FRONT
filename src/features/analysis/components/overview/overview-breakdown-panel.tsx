import { ArrowRight, ChartPie } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  formatCurrency,
  formatPercent,
  type AnalysisBreakdownItem,
} from '../../model/analysis-overview'
import { AnalysisPanel } from './overview-analysis-panel'

function BreakdownChart({
  items,
  label,
  colors,
}: {
  items: AnalysisBreakdownItem[]
  label: string
  colors: readonly string[]
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
        <ChartPie aria-hidden="true" className="size-8" />
        <p className="text-xs">該当する支出はありません</p>
      </div>
    )
  }

  return (
    <div className="grid min-h-28 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-1.5 sm:min-h-40 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <div aria-label={label} className="h-24 w-18 sm:h-36 sm:w-32">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="amount"
              innerRadius="55%"
              isAnimationActive
              nameKey="name"
              outerRadius="86%"
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {items.map((item, index) => (
                <Cell fill={colors[index % colors.length]} key={item.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 space-y-1.5 sm:space-y-2.5">
        {items.map((item, index) => (
          <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 text-[0.625rem] sm:gap-x-2 sm:text-xs" key={item.name}>
            <span
              aria-hidden="true"
              className="mt-0.5 size-2 shrink-0 rounded-full sm:size-2.5"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="min-w-0">
              <span className="flex min-w-0 items-baseline gap-1">
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 font-normal text-muted-foreground tabular-nums">
                  {formatPercent(item.ratio)}
                </span>
              </span>
              <span className="block font-semibold tabular-nums sm:mt-0.5">
                {formatCurrency(item.amount)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BreakdownPanel({
  title,
  items,
  chartLabel,
  colors,
  linkLabel,
  linkTo,
}: {
  title: string
  items: AnalysisBreakdownItem[]
  chartLabel: string
  colors: readonly string[]
  linkLabel: string
  linkTo: { search: string }
}) {
  return (
    <AnalysisPanel className="flex min-w-0 flex-col p-3 sm:p-6">
      <h2 className="text-sm font-semibold sm:text-lg">{title}</h2>
      <div className="mt-3 flex-1 sm:mt-5">
        <BreakdownChart colors={colors} items={items} label={chartLabel} />
      </div>
      <Link
        className="mt-3 flex min-h-11 items-center justify-between border-t pt-3 text-xs font-medium transition-colors hover:text-primary sm:text-sm"
        to={linkTo}
      >
        {linkLabel}
        <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </Link>
    </AnalysisPanel>
  )
}
