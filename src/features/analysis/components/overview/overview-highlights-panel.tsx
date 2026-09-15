import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
} from 'lucide-react'

import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

import {
  type AnalysisOverviewViewModel,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../../model/analysis-overview'
import { AnalysisPanel } from './overview-analysis-panel'
import { formatSignedPercent } from './overview-format'

function OverallHighlight({ data }: { data: AnalysisOverviewViewModel }) {
  const isIncrease = data.differenceAmount > 0
  const isDecrease = data.differenceAmount < 0
  const Icon = isIncrease
    ? ArrowUpRight
    : isDecrease
      ? ArrowDownRight
      : ArrowRight

  return (
    <Card className="flex flex-row items-start gap-3 rounded-xl bg-background p-3 sm:p-4">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          isIncrease
            ? 'bg-expense/10 text-expense'
            : isDecrease
              ? 'bg-success/10 text-success'
              : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs leading-5 font-medium sm:text-sm">
          支出は前期間より {formatCurrency(data.differenceAmount)}
          {isIncrease
            ? ' 増加しました'
            : isDecrease
              ? ' 減少しました'
              : 'で変化はありません'}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground sm:text-xs">
          {data.differenceRate === null
            ? '比較期間の支出がないため増減率は算出できません'
            : `前期間比 ${formatSignedPercent(data.differenceRate)}`}
        </p>
      </div>
    </Card>
  )
}

function FixedHighlight({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <Card className="flex flex-row items-start gap-3 rounded-xl bg-background p-3 sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
        <Lightbulb aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs leading-5 font-medium sm:text-sm">
          固定費の割合は {formatPercent(data.fixedExpenseRatio)} でした
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground sm:text-xs">
          直近月の固定費は前月比{' '}
          {formatSignedCurrency(data.latestFixedDifferenceAmount)}
          {data.latestFixedDifferenceRate === null
            ? ''
            : `（${formatSignedPercent(data.latestFixedDifferenceRate)}）`}
        </p>
      </div>
    </Card>
  )
}

export function HighlightsPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel>
      <h2 className="text-sm font-semibold sm:text-lg">今月のハイライト</h2>
      <div className="mt-4 grid gap-3 min-[400px]:grid-cols-2">
        <OverallHighlight data={data} />
        <FixedHighlight data={data} />
      </div>
    </AnalysisPanel>
  )
}
