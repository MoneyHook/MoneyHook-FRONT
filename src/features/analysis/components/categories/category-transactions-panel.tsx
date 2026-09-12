import { ChevronRight, Funnel } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

import type {
  CategoryAnalysisItem,
  CategoryTransactionItem,
} from '../../model/analysis-categories'
import { formatCurrency } from '../../model/analysis-overview'
import { CategoryAnalysisPanel } from './category-analysis-panel'
import { CategoryIcon } from '../category-icon'

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function TransactionRow({
  item,
  categoryName,
  onOpen,
}: {
  item: CategoryTransactionItem
  categoryName: string
  onOpen: (id: string) => void
}) {
  return (
    <button
      aria-label={`${item.name}を編集`}
      className="grid w-full grid-cols-[minmax(5.8rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[8rem_auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-2"
      onClick={() => onOpen(item.id)}
      type="button"
    >
      <span className="text-[0.6875rem] font-medium sm:text-sm">
        {formatTransactionDate(item.date)}
      </span>
      <CategoryIcon name={categoryName} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-sm">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground sm:text-xs">
          {item.subcategoryName}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {item.paymentName ? (
          <span className="hidden max-w-24 truncate rounded-md bg-muted px-2 py-1 text-[0.625rem] text-muted-foreground min-[390px]:block sm:text-xs">
            {item.paymentName}
          </span>
        ) : null}
        <span className="text-right">
          <span className="block text-xs font-semibold text-expense tabular-nums sm:text-sm">
            {formatCurrency(item.amount)}
          </span>
          {item.time ? (
            <span className="block text-[0.625rem] text-muted-foreground tabular-nums sm:text-xs">
              {item.time.slice(0, 5)}
            </span>
          ) : null}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </span>
    </button>
  )
}

export function CategoryTransactionsPanel({
  category,
  onOpen,
}: {
  category: CategoryAnalysisItem
  onOpen: (id: string) => void
}) {
  const transactions = category.transactions.slice(0, 3)
  return (
    <CategoryAnalysisPanel className="p-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          {category.name}の取引一覧
        </h2>
        <Button
          aria-label="取引を絞り込み（準備中）"
          className="text-success disabled:opacity-100"
          disabled
          size="sm"
          title="絞り込みは準備中です"
          variant="ghost"
        >
          絞り込み
          <Funnel aria-hidden="true" />
        </Button>
      </div>
      {transactions.length > 0 ? (
        <div className="divide-y border-t px-3 sm:px-4">
          {transactions.map((transaction) => (
            <TransactionRow
              categoryName={category.name}
              item={transaction}
              key={transaction.id}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : (
        <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
          このカテゴリの取引はありません
        </div>
      )}
      <div className="border-t p-3 sm:p-4">
        <button
          aria-label={`${category.name}のすべての取引を表示（準備中）`}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium text-muted-foreground disabled:cursor-default"
          disabled
          title="取引一覧との連携は準備中です"
          type="button"
        >
          {category.name}のすべての取引を表示
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </CategoryAnalysisPanel>
  )
}
