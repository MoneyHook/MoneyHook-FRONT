import { useId } from 'react'

import type { V1TransactionResource } from '@/shared/api/generated/model'
import { Card } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

type Props = {
  transaction: V1TransactionResource
  checked: boolean
  busy: boolean
  error?: string
  onSelect: (selected: boolean) => void
}

export function FamilySharingCard({
  transaction,
  checked,
  busy,
  error,
  onSelect,
}: Props) {
  const checkboxId = useId()
  const presentation = getCategoryPresentation(transaction.category_name, {
    isIncome: transaction.sign === 1,
  })
  const Icon = presentation.icon

  return (
    <Card className="block p-0">
      <label
        htmlFor={checkboxId}
        className={cn('block', busy ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <span className="flex items-center pl-3 sm:pl-4">
          <Checkbox
            id={checkboxId}
            className="rounded-[2px]"
            aria-label={`${transaction.transaction_name}を選択`}
            checked={checked}
            disabled={busy}
            onCheckedChange={(value) => onSelect(value === true)}
          />
          <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 text-left font-normal sm:gap-x-3 sm:px-4">
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
                {transaction.transaction_name}
              </span>
              <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground sm:text-sm">
                {transaction.category_name} <span aria-hidden="true">›</span>{' '}
                {transaction.sub_category_name}
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground sm:text-xs">
                {transaction.transaction_date}・
                {transaction.shared ? '共有中' : '未共有'}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span className="text-right">
                <span
                  className={cn(
                    'block text-sm font-semibold tabular-nums sm:text-lg',
                    transaction.sign === -1 ? 'text-expense' : 'text-income',
                  )}
                >
                  {transaction.sign === -1 ? '-' : '+'}¥
                  {transaction.amount.toLocaleString('ja-JP')}
                </span>
                {transaction.payment_name && (
                  <span className="mt-1 block max-w-24 truncate text-[0.6875rem] text-muted-foreground sm:max-w-32 sm:text-xs">
                    {transaction.payment_name}
                  </span>
                )}
              </span>
            </span>
          </span>
        </span>
        {error && (
          <span className="block px-4 pb-3 text-sm text-destructive">
            {error}
          </span>
        )}
      </label>
    </Card>
  )
}
