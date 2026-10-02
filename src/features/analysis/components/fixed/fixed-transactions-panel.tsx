import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

import type { FixedTransactionItem } from '../../model/analysis-fixed'
import { formatCurrency } from '../../model/analysis-overview'
import { CategoryIcon } from '../category-icon'
import { AnalysisPanel } from './fixed-analysis-panel'

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function TransactionRow({
  item,
  onOpen,
}: {
  item: FixedTransactionItem
  onOpen: (id: string) => void
}) {
  return (
    <li>
      <button
        aria-label={`${item.name}を編集`}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-1 py-4 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:px-2 sm:py-3"
        onClick={() => onOpen(item.id)}
        type="button"
      >
        <span className="col-span-3 flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground sm:col-span-1 sm:block sm:text-sm sm:text-foreground">
          {formatTransactionDate(item.date)}
          {item.time ? (
            <span className="tabular-nums sm:hidden">
              {item.time.slice(0, 5)}
            </span>
          ) : null}
        </span>
        <span className="row-start-2 self-start sm:row-auto sm:self-auto">
          <CategoryIcon name={item.categoryName} />
        </span>
        <span className="row-start-2 flex min-w-0 flex-col gap-1 sm:row-auto sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-sm font-semibold wrap-anywhere sm:truncate">
            {item.name}
          </span>
          <span className="text-xs wrap-anywhere text-muted-foreground sm:truncate">
            {item.categoryName} · {item.subcategoryName}
          </span>
        </span>
        <span className="col-start-2 row-start-3 flex min-w-0 flex-wrap items-baseline justify-between gap-2 sm:col-auto sm:row-auto sm:flex-nowrap sm:justify-end sm:text-right sm:whitespace-nowrap">
          {item.paymentName ? (
            <Badge
              className="max-w-full bg-muted px-2 py-1 text-xs font-normal whitespace-normal text-muted-foreground sm:max-w-28 sm:truncate sm:text-sm sm:whitespace-nowrap"
              variant="ghost"
            >
              {item.paymentName}
            </Badge>
          ) : null}
          <span className="ml-auto text-sm font-semibold whitespace-nowrap text-expense tabular-nums">
            {formatCurrency(item.amount)}
          </span>
          {item.time ? (
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {item.time.slice(0, 5)}
            </span>
          ) : null}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="col-start-3 row-span-2 row-start-2 size-4 text-muted-foreground sm:col-auto sm:row-auto sm:row-span-1"
        />
      </button>
    </li>
  )
}

export function TransactionsPanel({
  items,
  onOpen,
}: {
  items: FixedTransactionItem[]
  onOpen: (id: string) => void
}) {
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
            <TransactionRow
              item={transaction}
              key={transaction.id}
              onOpen={onOpen}
            />
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
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
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
