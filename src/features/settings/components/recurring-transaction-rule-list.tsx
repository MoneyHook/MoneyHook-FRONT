import { CircleDollarSign, Pause, Pencil, Play, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import type { RecurringTransactionRule } from '../model/recurring-transaction-settings'

export function RecurringTransactionRuleList({
  emptyMessage,
  isPaused,
  onDelete,
  onEdit,
  onSetIncluded,
  payments,
  rules,
}: {
  emptyMessage: string
  isPaused: boolean
  onDelete: (rule: RecurringTransactionRule) => void
  onEdit: (rule: RecurringTransactionRule) => void
  onSetIncluded: (rule: RecurringTransactionRule, include: boolean) => void
  payments: Array<{ payment_id: string; payment_name: string }>
  rules: RecurringTransactionRule[]
}) {
  if (rules.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-7 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y rounded-xl border">
      {rules.map((rule) => {
        const isIncome = rule.monthly_transaction_sign === 1
        const paymentName = rule.payment_id
          ? payments.find((payment) => payment.payment_id === rule.payment_id)?.payment_name
          : null

        return (
          <li className="flex items-center gap-3 px-4 py-3" key={rule.monthly_transaction_id}>
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', isIncome ? 'bg-income/12 text-income' : 'bg-expense/12 text-expense')}>
              <CircleDollarSign aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="truncate font-medium">{rule.monthly_transaction_name}</p>
                <span className={cn('text-sm font-semibold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
                  {isIncome ? '+' : '−'}¥{rule.monthly_transaction_amount.toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                毎月{rule.monthly_transaction_date}日 ・ {rule.category_name} ・ {rule.sub_category_name}{paymentName ? ` ・ ${paymentName}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button aria-label={`${rule.monthly_transaction_name}を編集`} onClick={() => onEdit(rule)} size="icon-sm" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button>
              <Button aria-label={isPaused ? `${rule.monthly_transaction_name}を再開` : `${rule.monthly_transaction_name}を停止`} onClick={() => onSetIncluded(rule, isPaused)} size="icon-sm" type="button" variant="ghost">
                {isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </Button>
              <Button aria-label={`${rule.monthly_transaction_name}を完全に削除`} onClick={() => onDelete(rule)} size="icon-sm" type="button" variant="destructive"><Trash2 aria-hidden="true" /></Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
