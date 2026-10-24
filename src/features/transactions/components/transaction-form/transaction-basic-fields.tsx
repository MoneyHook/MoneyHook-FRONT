import { CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'
import { ja } from 'react-day-picker/locale'

import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'
import { formatCalendarDate } from '../../model/transaction-form'
import { TransactionNameInput } from './transaction-name-input'

export function TransactionFormSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('block overflow-hidden', className)}>{children}</Card>
  )
}

export function TransactionFormRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-12 items-center gap-3 px-4 sm:min-h-16 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Props = Pick<
  TransactionFormController,
  | 'setDatePickerOpen'
  | 'datePickerOpen'
  | 'errors'
  | 'selectedDate'
  | 'setValue'
  | 'form'
  | 'payments'
  | 'recommendedTransactions'
  | 'isEdit'
  | 'isLoadingRecommendations'
  | 'recommendationsError'
  | 'handleNameChange'
  | 'handleNameCompositionStart'
  | 'handleNameCompositionEnd'
  | 'selectFrequentTransaction'
>

export function TransactionBasicFields({
  setDatePickerOpen,
  datePickerOpen,
  errors,
  selectedDate,
  setValue,
  form,
  payments,
  recommendedTransactions,
  isEdit,
  isLoadingRecommendations,
  recommendationsError,
  handleNameChange,
  handleNameCompositionStart,
  handleNameCompositionEnd,
  selectFrequentTransaction,
}: Props) {
  return (
    <TransactionFormSection>
      <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            aria-describedby={
              errors.transactionDate
                ? 'new-transaction-transactionDate-error'
                : undefined
            }
            aria-invalid={errors.transactionDate ? true : undefined}
            aria-label="日付"
            className="flex h-auto min-h-12 w-full items-center justify-start gap-3 rounded-none border-0 border-b border-border px-4 py-0 text-left font-normal whitespace-normal transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 aria-expanded:bg-transparent sm:min-h-16 sm:px-5 dark:hover:bg-muted/60"
            type="button"
          >
            <CalendarDays
              aria-hidden="true"
              className="size-6 shrink-0 text-muted-foreground"
            />
            <span className="text-sm font-medium sm:text-base">日付</span>
            <span
              className={cn(
                'ml-auto text-sm font-medium sm:text-base',
                !selectedDate && 'text-muted-foreground',
              )}
            >
              {selectedDate
                ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
                : '選択してください'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden p-0"
          sideOffset={8}
        >
          <Calendar
            aria-label="取引日を選択"
            defaultMonth={selectedDate}
            endMonth={new Date(9999, 11, 31)}
            locale={ja}
            mode="single"
            onSelect={(date) => {
              if (!date) {
                return
              }
              setValue('transactionDate', formatCalendarDate(date))
              setDatePickerOpen(false)
            }}
            selected={selectedDate}
          />
        </PopoverContent>
      </Popover>
      {errors.transactionDate ? (
        <p
          id="new-transaction-transactionDate-error"
          className="px-4 pb-3 text-sm text-destructive"
        >
          {errors.transactionDate}
        </p>
      ) : null}
      <TransactionFormRow className="border-b">
        <label
          className="text-sm font-medium sm:text-base"
          htmlFor="new-transaction-amount"
        >
          金額
        </label>
        <span className="ml-auto text-xl font-semibold">¥</span>
        <Input
          aria-describedby={
            errors.amount ? 'new-transaction-amount-error' : undefined
          }
          aria-invalid={errors.amount ? true : undefined}
          autoComplete="off"
          className="h-14 max-w-44 border-0 px-0 text-right text-2xl font-semibold tracking-[-0.04em] tabular-nums shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:h-16"
          id="new-transaction-amount"
          inputMode="numeric"
          maxLength={7}
          onChange={(event) =>
            setValue('amount', event.target.value.replace(/\D/g, ''))
          }
          placeholder="0"
          value={form.amount}
        />
      </TransactionFormRow>
      {errors.amount ? (
        <p
          id="new-transaction-amount-error"
          className="px-4 pb-3 text-sm text-destructive"
        >
          {errors.amount}
        </p>
      ) : null}
      <TransactionFormRow className="min-h-14 sm:min-h-16">
        <label
          className="text-sm font-medium sm:text-base"
          htmlFor="new-transaction-name"
        >
          取引名
        </label>
        <TransactionNameInput
          form={form}
          errors={errors}
          isEdit={isEdit}
          payments={payments}
          recommendedTransactions={recommendedTransactions}
          isLoadingRecommendations={isLoadingRecommendations}
          recommendationsError={recommendationsError}
          handleNameChange={handleNameChange}
          handleNameCompositionStart={handleNameCompositionStart}
          handleNameCompositionEnd={handleNameCompositionEnd}
          selectFrequentTransaction={selectFrequentTransaction}
        />
      </TransactionFormRow>
      {errors.transactionName ? (
        <p
          id="new-transaction-transactionName-error"
          className="px-4 pb-3 text-sm text-destructive"
        >
          {errors.transactionName}
        </p>
      ) : null}
    </TransactionFormSection>
  )
}
