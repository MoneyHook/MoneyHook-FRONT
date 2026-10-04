import { CalendarDays, UserRound, Users } from 'lucide-react'

import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

import {
  type FamilyPayerTotal,
  type FamilyTransactionDayGroup,
  formatFamilyCurrency,
  getFamilyPayerName,
} from '../model/family-transactions'
import { FamilyTransactionRow } from './family-transaction-row'

type FamilyTransactionsListData = {
  familyGroups: FamilyTransactionDayGroup[]
  payerTotals: FamilyPayerTotal[]
  expenseAmount: number
  incomeAmount: number
  balanceAmount: number
}

function FamilyMonthlySummary({
  data,
  month,
  hasFilters,
  onMonthChange,
}: {
  data: FamilyTransactionsListData
  month: { monthLabel: string; monthInput: string; currentMonthInput: string }
  hasFilters: boolean
  onMonthChange: (month: string) => void
}) {
  return (
    <Card
      aria-label={`${month.monthLabel}の家族の収支`}
      className="block px-4 py-4 sm:px-6 sm:py-5"
    >
      <div className="flex justify-end">
        <MonthPicker
          className="px-1 text-base font-semibold sm:text-lg"
          maxMonth={month.currentMonthInput}
          monthInput={month.monthInput}
          monthLabel={month.monthLabel}
          onChange={onMonthChange}
        />
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x">
        {[
          { label: '支出合計', amount: data.expenseAmount },
          { label: '収入合計', amount: data.incomeAmount },
          { label: '収支', amount: data.balanceAmount },
        ].map(({ label, amount }, index) => (
          <div
            key={label}
            className={cn(
              'min-w-0',
              index === 0
                ? 'pr-2 sm:pr-6'
                : index === 1
                  ? 'px-2 sm:px-6'
                  : 'pl-2 sm:pl-6',
            )}
          >
            <dt className="text-xs text-muted-foreground sm:text-sm">
              {label}
            </dt>
            <dd
              className={cn(
                'mt-1 text-xs font-semibold tracking-[-0.05em] whitespace-nowrap tabular-nums min-[390px]:text-sm sm:text-2xl',
                index === 2 &&
                  (amount < 0
                    ? 'text-expense'
                    : amount > 0
                      ? 'text-income'
                      : 'text-muted-foreground'),
              )}
            >
              {index === 2 && amount !== 0 ? (amount < 0 ? '-' : '+') : ''}
              {formatFamilyCurrency(amount)}
            </dd>
          </div>
        ))}
      </dl>
      <section
        aria-labelledby="family-payer-totals-title"
        className="mt-5 border-t pt-4 sm:mt-6 sm:pt-5"
      >
        <h2 id="family-payer-totals-title" className="text-sm font-semibold">
          支払い者別の支出
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasFilters
            ? '絞り込み中の取引の支払額です。'
            : 'この月に各メンバーが支払った金額です。'}
          収入・集計除外の取引は含みません。
        </p>
        {data.payerTotals.length ? (
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {data.payerTotals.map((total) => {
              const Icon = total.payer.kind === 'common' ? Users : UserRound
              const percentage =
                data.expenseAmount > 0
                  ? (total.amount / data.expenseAmount) * 100
                  : 0
              return (
                <div key={total.id} className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="size-3.5" />
                      </span>
                      <span className="truncate font-medium">
                        {getFamilyPayerName(total.payer)}
                      </span>
                      {total.payer.state === 'left' && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          （退出済み）
                        </span>
                      )}
                    </dt>
                    <dd className="shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatFamilyCurrency(total.amount)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {Math.round(percentage)}%
                      </span>
                    </dd>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            集計対象の支出はありません。
          </p>
        )}
      </section>
    </Card>
  )
}

function FamilyTransactionDay({
  group,
  onOpen,
}: {
  group: FamilyTransactionDayGroup
  onOpen: (id: string) => void
}) {
  const date = new Date(`${group.date}T00:00:00`)
  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日（${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}）`
  return (
    <section aria-labelledby={`family-transactions-${group.date}`}>
      <div className="mb-2 flex items-center justify-between gap-4 px-1">
        <h2
          id={`family-transactions-${group.date}`}
          className="text-sm font-semibold sm:text-base"
        >
          {dateLabel}
        </h2>
        <p className="flex flex-wrap items-center justify-end gap-x-2 text-xs font-semibold tabular-nums sm:text-sm">
          {group.expenseAmount > 0 && (
            <span>支出 {formatFamilyCurrency(group.expenseAmount)}</span>
          )}
          {group.incomeAmount > 0 && (
            <span className="text-income">
              収入 {formatFamilyCurrency(group.incomeAmount)}
            </span>
          )}
        </p>
      </div>
      <Card className="block divide-y overflow-hidden p-0">
        {group.entries.map((entry) => (
          <FamilyTransactionRow
            key={entry.entry_id}
            entry={entry}
            onOpen={onOpen}
          />
        ))}
      </Card>
    </section>
  )
}

export function FamilyTransactionsListPanel({
  data,
  month,
  onOpen,
  onMonthChange,
  hasFilters,
  onClearFilters,
}: {
  data: FamilyTransactionsListData
  month: { monthLabel: string; monthInput: string; currentMonthInput: string }
  onOpen: (id: string) => void
  onMonthChange: (month: string) => void
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="motion-route-enter space-y-4 pt-4 sm:space-y-5 sm:pt-6">
      <FamilyMonthlySummary
        data={data}
        month={month}
        hasFilters={hasFilters}
        onMonthChange={onMonthChange}
      />
      {data.familyGroups.length ? (
        <div className="space-y-5 sm:space-y-6">
          {data.familyGroups.map((group) => (
            <FamilyTransactionDay
              key={group.date}
              group={group}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
          <CalendarDays
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <h2 className="mt-4 font-semibold">
            {hasFilters
              ? '条件に一致する取引はありません'
              : 'この月の取引はありません'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? '絞り込み条件を変更するか、すべて解除してください。'
              : `${month.monthLabel}に記録された取引はありません。`}
          </p>
          {hasFilters && (
            <Button className="mt-4" onClick={onClearFilters} variant="outline">
              すべて解除
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
