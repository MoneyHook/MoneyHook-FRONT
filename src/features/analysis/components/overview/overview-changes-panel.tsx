import { cn } from '@/shared/lib/utils'
import {
  formatSignedCurrency,
  type AnalysisChangeItem,
  type AnalysisOverviewViewModel,
} from '../../model/analysis-overview'
import { AnalysisPanel } from './overview-analysis-panel'
import { formatSignedPercent } from './overview-format'

function ChangeList({
  items,
  direction,
}: {
  items: AnalysisChangeItem[]
  direction: 'increase' | 'decrease'
}) {
  if (items.length === 0) {
    return (
      <p className="py-5 text-center text-xs text-muted-foreground">
        該当する項目はありません
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          className="grid grid-cols-[3.5rem_minmax(2rem,1fr)_auto] items-center gap-2 text-[0.6875rem] sm:grid-cols-[6rem_minmax(4rem,1fr)_auto] sm:text-sm"
          key={item.name}
        >
          <span className="truncate font-medium">{item.name}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                'block h-full rounded-full',
                direction === 'increase' ? 'bg-expense' : 'bg-success',
              )}
              style={{ width: `${item.barRatio}%` }}
            />
          </span>
          <span className="text-right tabular-nums">
            <span
              className={cn(
                'block font-semibold',
                direction === 'increase' ? 'text-expense' : 'text-success',
              )}
            >
              {formatSignedCurrency(item.amount)}
            </span>
            <span className="block text-[0.625rem] text-muted-foreground">
              {item.rate === null ? '—' : formatSignedPercent(item.rate)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ChangesPanel({ data }: { data: AnalysisOverviewViewModel }) {
  return (
    <AnalysisPanel>
      <h2 className="text-sm font-semibold sm:text-lg">
        支出の増減（前期間比）
      </h2>
      <div className="mt-4 grid gap-4 min-[400px]:grid-cols-2 min-[400px]:divide-x sm:mt-5 sm:gap-5">
        <div className="min-[400px]:pr-3 sm:pr-6">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            増加したカテゴリ
          </p>
          <ChangeList direction="increase" items={data.increases} />
        </div>
        <div className="min-[400px]:pl-3 sm:pl-6">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            減少したカテゴリ
          </p>
          <ChangeList direction="decrease" items={data.decreases} />
        </div>
      </div>
    </AnalysisPanel>
  )
}
