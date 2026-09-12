import { ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'

import { formatCurrency, type TransactionItem } from '../../model/transactions'

function CategoryIcon({ item }: { item: TransactionItem }) {
  const presentation = getCategoryPresentation(item.categoryName, {
    isIncome: item.sign === 1,
  })
  const Icon = presentation.icon

  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11',
        presentation.iconClassName,
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </span>
  )
}

export function TransactionRow({
  item,
  onOpen,
}: {
  item: TransactionItem
  onOpen: (id: string) => void
}) {
  return (
    <button
      aria-label={`${item.name}を編集`}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-4"
      onClick={() => onOpen(item.id)}
      type="button"
    >
      <CategoryIcon item={item} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold sm:text-base">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
          {item.categoryName} <span aria-hidden="true">›</span>{' '}
          {item.subcategoryName}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 sm:gap-4">
        {item.paymentName ? (
          <span className="hidden max-w-28 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground min-[390px]:block sm:text-sm">
            {item.paymentName}
          </span>
        ) : null}
        <span
          className={cn(
            'min-w-18 text-right text-base font-semibold tabular-nums sm:min-w-24 sm:text-lg',
            item.sign === -1 ? 'text-expense' : 'text-income',
          )}
        >
          {item.sign === -1 ? '-' : '+'}
          {formatCurrency(item.amount)}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </span>
    </button>
  )
}
