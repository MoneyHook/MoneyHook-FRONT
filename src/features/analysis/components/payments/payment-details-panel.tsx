import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'

import { formatCurrency } from '../../model/analysis-overview'
import type {
  AnalysisPaymentsViewModel,
  PaymentMethodItem,
  PaymentTransactionItem,
} from '../../model/analysis-payments'
import { PaymentIcon } from './payment-icon'
import { AnalysisPanel } from './payments-analysis-panel'

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function PaymentTransactionRow({
  item,
  onOpen,
}: {
  item: PaymentTransactionItem
  onOpen: (id: string) => void
}) {
  return (
    <li>
      <button
        aria-label={`${item.name}を編集`}
        className="grid w-full grid-cols-[minmax(5.8rem,auto)_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-2"
        onClick={() => onOpen(item.id)}
        type="button"
      >
        <span className="text-[0.6875rem] font-medium sm:text-sm">
          {formatTransactionDate(item.date)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold sm:text-sm">
            {item.name}
          </span>
          <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground sm:text-xs">
            {item.categoryName} · {item.subcategoryName}
          </span>
        </span>
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
      </button>
    </li>
  )
}

function PaymentTransactions({
  payment,
  onOpen,
}: {
  payment: PaymentMethodItem
  onOpen: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleTransactions = expanded
    ? payment.transactions
    : payment.transactions.slice(0, 5)

  return (
    <div className="border-t bg-muted/20 px-3 pb-3 sm:px-5 sm:pb-4">
      <div className="flex items-center justify-between gap-4 py-3">
        <p className="text-xs font-semibold sm:text-sm">{payment.name}の取引</p>
        <span className="text-[0.6875rem] text-muted-foreground tabular-nums sm:text-xs">
          {payment.transactions.length}件
        </span>
      </div>
      {visibleTransactions.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card px-2 sm:px-3">
          {visibleTransactions.map((transaction) => (
            <PaymentTransactionRow
              item={transaction}
              key={transaction.id}
              onOpen={onOpen}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          この支払い方法の取引はありません
        </div>
      )}
      {payment.transactions.length > 5 ? (
        <button
          aria-expanded={expanded}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border bg-card text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded
            ? '最新5件に戻す'
            : `すべて表示（${payment.transactions.length}件）`}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      ) : null}
    </div>
  )
}

export function PaymentDetailsPanel({
  data,
  onOpen,
  selectedPayment,
  onPaymentChange,
}: {
  data: AnalysisPaymentsViewModel
  onOpen: (id: string) => void
  selectedPayment: PaymentMethodItem | null
  onPaymentChange: (paymentId: string | null) => void
}) {
  return (
    <AnalysisPanel
      className="scroll-mt-4 overflow-hidden p-0"
      id="payment-details"
    >
      <div className="flex items-baseline justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">支払い方法の詳細</h2>
        <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
          {data.payments.length}件
        </span>
      </div>
      <ul className="divide-y border-t">
        {data.payments.map((payment, index) => {
          const isSelected = selectedPayment?.id === payment.id
          return (
            <li key={payment.id}>
              <button
                aria-expanded={isSelected}
                className="grid min-h-20 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:min-h-24 sm:px-6"
                onClick={() => onPaymentChange(isSelected ? null : payment.id)}
                type="button"
              >
                <PaymentIcon index={index} payment={payment} size="large" />
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold sm:text-base">
                      {payment.name}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1 text-[0.625rem] text-muted-foreground sm:text-xs">
                      {payment.typeName ?? '未分類'}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.6875rem] text-muted-foreground sm:text-sm">
                    取引数{' '}
                    <span className="tabular-nums">
                      {payment.transactionCount}件
                    </span>
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block text-sm font-semibold text-expense sm:text-base">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="mt-1 block text-[0.625rem] text-muted-foreground sm:text-xs">
                    平均単価 {formatCurrency(payment.averageAmount)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-4 text-muted-foreground transition-transform',
                    isSelected && 'rotate-90',
                  )}
                />
              </button>
              {isSelected ? (
                <PaymentTransactions onOpen={onOpen} payment={payment} />
              ) : null}
            </li>
          )
        })}
      </ul>
    </AnalysisPanel>
  )
}
