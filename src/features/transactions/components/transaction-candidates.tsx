import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import type { FrequentTransactionResponseTransactionListItem } from '@/shared/api/generated/model/frequentTransactionResponseTransactionListItem'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

const CANDIDATES_PER_PAGE = 6

type TransactionCandidatesProps = {
  transactions: FrequentTransactionResponseTransactionListItem[]
  onSelect: (transaction: FrequentTransactionResponseTransactionListItem) => void
}

function CategoryBadge({ name }: { name: string }) {
  const presentation = getCategoryPresentation(name)
  const Icon = presentation.icon

  return (
    <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full', presentation.iconClassName)}>
      <Icon aria-hidden="true" className="size-3.5" />
    </span>
  )
}

export function TransactionCandidates({ transactions, onSelect }: TransactionCandidatesProps) {
  const [visibleCount, setVisibleCount] = useState(CANDIDATES_PER_PAGE)
  const visibleTransactions = transactions.slice(0, visibleCount)
  const hasMoreTransactions = visibleCount < transactions.length

  return (
    <section aria-labelledby="transaction-candidates-title" className="rounded-2xl border bg-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.03em]" id="transaction-candidates-title">よく使う項目</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">タップで取引内容をすばやく入力できます。</p>
        </div>
        {hasMoreTransactions ? (
          <Button
            aria-label="取引候補をもっと表示"
            className="size-11 rounded-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
            onClick={() => setVisibleCount((current) => Math.min(current + CANDIDATES_PER_PAGE, transactions.length))}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <ChevronDown aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleTransactions.map((transaction) => (
          <button
            aria-label={`${transaction.transaction_name}を候補から適用`}
            className="group rounded-full border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            key={`${transaction.transaction_name}-${transaction.category_id}-${transaction.sub_category_id}`}
            onClick={() => onSelect(transaction)}
            type="button"
          >
            <Badge className="h-9 gap-1.5 rounded-full px-3 text-sm font-medium group-hover:bg-muted [&>span]:shrink-0 [&>span+span]:min-w-0 [&>span+span]:truncate [&>span+span]:max-w-52" variant="outline">
              <CategoryBadge name={transaction.category_name} />
              <span>{transaction.transaction_name}</span>
            </Badge>
          </button>
        ))}
      </div>
    </section>
  )
}
