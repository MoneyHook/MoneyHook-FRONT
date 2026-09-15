import { Funnel, X } from 'lucide-react'
import { type ComponentProps, type ReactNode } from 'react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { useTransactionFilterReferences } from '../../api/use-transaction-filter-references'
import {
  summarizeFilteredTransactions,
  type TransactionFilters,
} from '../../model/transaction-filters'
import {
  formatBalance,
  formatCurrency,
  type TransactionItem,
} from '../../model/transactions'

type FilterReferences = ReturnType<typeof useTransactionFilterReferences>

export function TransactionFilterButton({
  activeCount,
  className,
  ...props
}: ComponentProps<typeof Button> & { activeCount: number }) {
  return (
    <Button
      aria-label="取引を絞り込む"
      className={cn('relative', className)}
      size="icon-lg"
      variant="ghost"
      {...props}
    >
      <Funnel aria-hidden="true" className="size-5" />
      {activeCount ? (
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  )
}

function FilterChoice({
  children,
  onClick,
  selected,
}: {
  children: ReactNode
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        'min-h-9 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function FilterSection({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-start">
      <h3 className="pt-2 text-sm font-semibold">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

export function TransactionsFilterPanel({
  draft,
  onChange,
  onClear,
  onApply,
  references,
}: {
  draft: TransactionFilters
  onChange: (next: TransactionFilters) => void
  onClear: () => void
  onApply: () => void
  references: FilterReferences
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
        <FilterSection label="収支">
          {(
            [
              [null, 'すべて'],
              ['expense', '支出'],
              ['income', '収入'],
            ] as const
          ).map(([value, label]) => (
            <FilterChoice
              key={label}
              onClick={() => onChange({ ...draft, sign: value })}
              selected={draft.sign === value}
            >
              {label}
            </FilterChoice>
          ))}
        </FilterSection>
        <FilterSection label="カテゴリ">
          <FilterChoice
            onClick={() => onChange({ ...draft, categoryId: null })}
            selected={!draft.categoryId}
          >
            すべて
          </FilterChoice>
          {references.isPending ? (
            <span className="py-2 text-sm text-muted-foreground">
              読み込み中…
            </span>
          ) : null}
          {!references.isPending &&
            references.categories.map((category) => (
              <FilterChoice
                key={category.category_id}
                onClick={() =>
                  onChange({ ...draft, categoryId: category.category_id })
                }
                selected={draft.categoryId === category.category_id}
              >
                {category.category_name}
              </FilterChoice>
            ))}
        </FilterSection>
        <FilterSection label="支払方法">
          <FilterChoice
            onClick={() => onChange({ ...draft, paymentId: null })}
            selected={!draft.paymentId}
          >
            すべて
          </FilterChoice>
          {references.isPending ? (
            <span className="py-2 text-sm text-muted-foreground">
              読み込み中…
            </span>
          ) : null}
          {!references.isPending &&
            references.payments.map((payment) => (
              <FilterChoice
                key={payment.payment_id}
                onClick={() =>
                  onChange({ ...draft, paymentId: payment.payment_id })
                }
                selected={draft.paymentId === payment.payment_id}
              >
                {payment.payment_name}
              </FilterChoice>
            ))}
        </FilterSection>
        <FilterSection label="種別">
          {(
            [
              [null, 'すべて'],
              ['fixed', '固定費'],
              ['variable', '変動費'],
            ] as const
          ).map(([value, label]) => (
            <FilterChoice
              key={label}
              onClick={() => onChange({ ...draft, fixed: value })}
              selected={draft.fixed === value}
            >
              {label}
            </FilterChoice>
          ))}
        </FilterSection>
        {references.isError ? (
          <p className="text-sm text-muted-foreground">
            カテゴリと支払方法を取得できませんでした。
          </p>
        ) : null}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t px-5 py-4 md:px-6 md:py-5">
        <Button onClick={onClear} type="button" variant="outline">
          すべて解除
        </Button>
        <Button onClick={onApply} type="button">
          適用
        </Button>
      </div>
    </div>
  )
}

export function ActiveFilterChips({
  filters,
  items,
  onRemove,
  references,
}: {
  filters: TransactionFilters
  items: TransactionItem[]
  onRemove: (key: keyof TransactionFilters) => void
  references: FilterReferences
}) {
  const categoryName = filters.categoryId
    ? (references.categories.find(
        (item) => item.category_id === filters.categoryId,
      )?.category_name ??
      items.find((item) => item.categoryId === filters.categoryId)
        ?.categoryName)
    : null
  const paymentName = filters.paymentId
    ? (references.payments.find((item) => item.payment_id === filters.paymentId)
        ?.payment_name ??
      items.find((item) => item.paymentId === filters.paymentId)?.paymentName)
    : null
  const entries = [
    filters.sign
      ? {
          key: 'sign' as const,
          label: filters.sign === 'expense' ? '支出' : '収入',
        }
      : null,
    categoryName ? { key: 'categoryId' as const, label: categoryName } : null,
    paymentName ? { key: 'paymentId' as const, label: paymentName } : null,
    filters.fixed
      ? {
          key: 'fixed' as const,
          label: filters.fixed === 'fixed' ? '固定費' : '変動費',
        }
      : null,
  ].filter(Boolean) as Array<{ key: keyof TransactionFilters; label: string }>
  if (!entries.length) return null
  return (
    <div aria-label="適用中の絞り込み" className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <button
          aria-label={`${entry.label}を解除`}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          key={entry.key}
          onClick={() => onRemove(entry.key)}
          type="button"
        >
          <span aria-hidden="true">{entry.label}</span>
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

export function FilterResultSummary({
  summary,
  sign,
}: {
  summary: ReturnType<typeof summarizeFilteredTransactions>
  sign: TransactionFilters['sign']
}) {
  const detail =
    sign === 'expense'
      ? `支出 ${formatCurrency(summary.expenseAmount)}`
      : sign === 'income'
        ? `収入 ${formatCurrency(summary.incomeAmount)}`
        : `支出 ${formatCurrency(summary.expenseAmount)}・収入 ${formatCurrency(summary.incomeAmount)}・収支 ${formatBalance(summary.balanceAmount)}`
  return (
    <p className="text-sm font-semibold tabular-nums sm:text-base">
      {summary.count}件・{detail}
    </p>
  )
}
