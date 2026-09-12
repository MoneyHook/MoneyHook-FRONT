import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import type { FixedTransactionItem } from '../../model/analysis-fixed'
import { formatCurrency } from '../../model/analysis-overview'
import { AnalysisPanel } from './fixed-analysis-panel'
import { CategoryIcon } from '../category-icon'

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function TransactionRow({ item, onOpen }: { item: FixedTransactionItem; onOpen: (id: string) => void }) {
  return (
    <li>
      <button
        aria-label={`${item.name}を編集`}
        className="grid w-full grid-cols-[minmax(5.8rem,auto)_auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-1 py-3 text-left outline-none transition-colors hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:px-2"
        onClick={() => onOpen(item.id)}
        type="button"
      >
      <span className="text-[0.6875rem] font-medium sm:text-sm">
        {formatTransactionDate(item.date)}
      </span>
      <CategoryIcon name={item.categoryName} />
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-xs font-semibold sm:text-sm">
          {item.name}
        </span>
        <span className="truncate text-[0.625rem] text-muted-foreground sm:text-xs">
          {item.categoryName} · {item.subcategoryName}
        </span>
      </span>
      <span className="flex items-baseline justify-end gap-2 whitespace-nowrap text-right">
        {item.paymentName ? (
          <Badge
            className="hidden max-w-28 truncate bg-muted px-2 py-1 text-xs font-normal text-muted-foreground min-[390px]:inline-flex sm:text-sm"
            variant="ghost"
          >
            {item.paymentName}
          </Badge>
        ) : null}
        <span className="text-xs font-semibold text-expense tabular-nums sm:text-sm">
          {formatCurrency(item.amount)}
        </span>
        {item.time ? (
          <span className="text-[0.625rem] text-muted-foreground tabular-nums sm:text-xs">
            {item.time.slice(0, 5)}
          </span>
        ) : null}
      </span>
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </button>
    </li>
  )
}

export function TransactionsPanel({ items, onOpen }: { items: FixedTransactionItem[]; onOpen: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? items : items.slice(0, 5)

  return (
    <AnalysisPanel className="scroll-mt-4 p-0" id="fixed-transactions">
      <div className="flex items-baseline justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">固定費の取引一覧</h2>
        <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
          {items.length}件
        </span>
      </div>
      {visibleItems.length > 0 ? (
        <ul className="divide-y border-t px-3 transition-[max-height] duration-200 sm:px-4">
          {visibleItems.map((transaction) => (
            <TransactionRow item={transaction} key={transaction.id} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
          選択したカテゴリの固定費取引はありません
        </div>
      )}
      {items.length > 5 ? (
        <div className="border-t p-3 sm:p-4">
          <button
            aria-expanded={expanded}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? '最新5件に戻す' : `すべて表示（${items.length}件）`}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      ) : null}
    </AnalysisPanel>
  )
}
