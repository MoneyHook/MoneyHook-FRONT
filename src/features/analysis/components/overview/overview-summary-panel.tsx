import {
  type AnalysisOverviewViewModel,
  formatCurrency,
  formatPercent,
} from '../../model/analysis-overview'
import { AnalysisPanel } from './overview-analysis-panel'

export function SummaryPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel className="p-3 sm:p-6">
      <h2 className="text-sm font-semibold sm:text-lg">サマリー</h2>
      <div className="mt-3 grid grid-cols-3 divide-x sm:mt-6">
        <div className="min-w-0 pr-3 sm:pr-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            総支出
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.expenseAmount)}
          </p>
          <p className="mt-1 truncate text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            月平均 {formatCurrency(data.monthlyAverageExpense)}
          </p>
        </div>
        <div className="min-w-0 px-3 sm:px-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            固定費
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.fixedExpenseAmount)}
          </p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            {formatPercent(data.fixedExpenseRatio)}
          </p>
        </div>
        <div className="min-w-0 pl-3 sm:pl-7">
          <p className="text-[0.6875rem] text-muted-foreground sm:text-sm">
            変動費
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.035em] tabular-nums sm:text-3xl">
            {formatCurrency(data.variableExpenseAmount)}
          </p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground tabular-nums sm:text-sm">
            {formatPercent(data.variableExpenseRatio)}
          </p>
        </div>
      </div>
    </AnalysisPanel>
  )
}
