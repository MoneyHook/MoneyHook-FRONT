import { ChevronRight, UserRound, Users } from 'lucide-react'

import type { HouseholdEntry } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

import {
  formatFamilyCurrency,
  getFamilyPayerName,
} from '../model/family-transactions'

export function FamilyTransactionRow({
  entry,
  onOpen,
}: {
  entry: HouseholdEntry
  onOpen: (id: string) => void
}) {
  const presentation = getCategoryPresentation(entry.category_name, {
    isIncome: entry.sign === 1,
  })
  const Icon = presentation.icon
  const PayerIcon = entry.payer.kind === 'common' ? Users : UserRound
  const payerName = getFamilyPayerName(entry.payer)
  const statusLabel = [
    ...(entry.corrected ? ['訂正済み'] : []),
    ...(entry.excluded_from_totals ? ['集計除外'] : []),
  ].join('・')

  return (
    <Button
      variant="ghost"
      aria-label={`${entry.transaction_name}、${entry.sign === -1 ? '支払い者' : '受け取り者'} ${payerName}、${entry.amount.toLocaleString('ja-JP')}円の詳細を表示`}
      className="grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 rounded-none border-0 px-3 py-3 text-left font-normal whitespace-normal transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:translate-y-0 sm:gap-x-3 sm:px-4 dark:hover:bg-muted/45"
      onClick={() => onOpen(entry.entry_id)}
      type="button"
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11',
          presentation.iconClassName,
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-base">
          {entry.transaction_name}
        </span>
        <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground sm:text-sm">
          {entry.category_name} <span aria-hidden="true">›</span>{' '}
          {entry.household_sub_category_name ?? '指定なし'}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1 text-xs font-medium">
          <PayerIcon
            aria-hidden="true"
            className="size-3 shrink-0 text-primary"
          />
          <span className="shrink-0 text-[0.6875rem] font-normal text-muted-foreground">
            {entry.sign === -1 ? '支払い' : '受け取り'}
          </span>
          <span className="truncate">{payerName}</span>
          {entry.payer.state === 'left' && (
            <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
              （退出済み）
            </span>
          )}
        </span>
        {statusLabel && (
          <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground">
            {statusLabel}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <span className="text-right">
          <span
            className={cn(
              'block text-sm font-semibold tabular-nums sm:text-lg',
              entry.sign === -1 ? 'text-expense' : 'text-income',
            )}
          >
            {entry.sign === -1 ? '-' : '+'}
            {formatFamilyCurrency(entry.amount)}
          </span>
          {entry.household_payment_name && (
            <span className="mt-1 block max-w-24 truncate text-[0.6875rem] text-muted-foreground sm:max-w-32 sm:text-xs">
              {entry.household_payment_name}
            </span>
          )}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </span>
    </Button>
  )
}
