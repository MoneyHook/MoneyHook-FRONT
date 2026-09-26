import { ChevronDown, ChevronRight, Funnel } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

import type {
  CategoryAnalysisItem,
  CategoryTransactionItem,
  SubcategoryAnalysisItem,
} from '../../model/analysis-categories'
import { formatCurrency } from '../../model/analysis-overview'
import { CategoryIcon } from '../category-icon'
import { CategoryAnalysisPanel } from './category-analysis-panel'

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
  onSubcategoryChange,
  selectedSubcategory,
}: {
  category: CategoryAnalysisItem
  onOpen: (id: string) => void
  onSubcategoryChange: (subcategoryId: string | null) => void
  selectedSubcategory: SubcategoryAnalysisItem | null
}) {
  const [expandedFor, setExpandedFor] = useState<{
    categoryId: string
    subcategoryId: string | null
  } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const selectedSubcategoryId = selectedSubcategory?.id ?? null
  const expanded =
    expandedFor?.categoryId === category.id &&
    expandedFor.subcategoryId === selectedSubcategoryId
  const transactions = selectedSubcategory
    ? category.transactions.filter(
        (transaction) => transaction.subcategoryId === selectedSubcategory.id,
      )
    : category.transactions
  const visibleTransactions = expanded ? transactions : transactions.slice(0, 3)

  return (
    <CategoryAnalysisPanel className="p-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          {category.name}の取引一覧
        </h2>
        <Popover onOpenChange={setFilterOpen} open={filterOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label="取引を絞り込む"
              aria-expanded={filterOpen}
              className={cn(selectedSubcategory && 'text-primary', 'shrink-0')}
              size="sm"
              variant="ghost"
            >
              絞り込み
              <Funnel aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3" sideOffset={8}>
            <h3 className="text-sm font-semibold">サブカテゴリ</h3>
            <div
              aria-label="サブカテゴリで絞り込む"
              className="mt-2 grid gap-1"
            >
              <button
                aria-pressed={!selectedSubcategory}
                className={cn(
                  'min-h-10 rounded-lg px-3 text-left text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  !selectedSubcategory && 'bg-primary/10 text-primary',
                )}
                onClick={() => {
                  onSubcategoryChange(null)
                  setFilterOpen(false)
                }}
                type="button"
              >
                すべて
              </button>
              {category.subcategories.map((subcategory) => {
                const selected = subcategory.id === selectedSubcategory?.id
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      'min-h-10 rounded-lg px-3 text-left text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      selected && 'bg-primary/10 text-primary',
                    )}
                    key={subcategory.id}
                    onClick={() => {
                      onSubcategoryChange(subcategory.id)
                      setFilterOpen(false)
                    }}
                    type="button"
                  >
                    {subcategory.name}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {visibleTransactions.length > 0 ? (
        <div className="divide-y border-t px-3 sm:px-4">
          {visibleTransactions.map((transaction) => (
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
          <p>
            {selectedSubcategory
              ? `${selectedSubcategory.name}の取引はありません`
              : 'このカテゴリの取引はありません'}
          </p>
          {selectedSubcategory ? (
            <Button
              className="mt-3"
              onClick={() => onSubcategoryChange(null)}
              size="sm"
              variant="outline"
            >
              絞り込みを解除
            </Button>
          ) : null}
        </div>
      )}
      {transactions.length > 3 ? (
        <div className="border-t p-3 sm:p-4">
          <button
            aria-expanded={expanded}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() =>
              setExpandedFor(
                expanded
                  ? null
                  : {
                      categoryId: category.id,
                      subcategoryId: selectedSubcategoryId,
                    },
              )
            }
            type="button"
          >
            {expanded
              ? '最新3件に戻す'
              : `すべて表示（${transactions.length}件）`}
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
    </CategoryAnalysisPanel>
  )
}
