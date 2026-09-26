import { CalendarDays, ChevronRight, Info } from 'lucide-react'
import { ja } from 'react-day-picker/locale'

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
import {
  TransactionCandidateChip,
  TransactionCandidates,
} from '../transaction-candidates'
import { CategoryIcon, PaymentIcon } from './transaction-form-icons'

function FormSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('block overflow-hidden', className)}>{children}</Card>
  )
}

function FormRow({
  children,
  className,
}: {
  children: React.ReactNode
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
  | 'handleSubmit'
  | 'setDatePickerOpen'
  | 'datePickerOpen'
  | 'errors'
  | 'selectedDate'
  | 'setValue'
  | 'form'
  | 'openCategorySelection'
  | 'selectedCategory'
  | 'selectedSubcategory'
  | 'payments'
  | 'setSelectionSheet'
  | 'selectedPayment'
  | 'paymentTypeNames'
  | 'paymentsError'
  | 'recommendedTransactions'
  | 'handleNameChange'
  | 'handleNameCompositionStart'
  | 'handleNameCompositionEnd'
  | 'frequentTransactions'
  | 'selectFrequentTransaction'
>

export function TransactionFormFields({
  handleSubmit,
  setDatePickerOpen,
  datePickerOpen,
  errors,
  selectedDate,
  setValue,
  form,
  openCategorySelection,
  selectedCategory,
  selectedSubcategory,
  payments,
  setSelectionSheet,
  selectedPayment,
  paymentTypeNames,
  paymentsError,
  recommendedTransactions,
  handleNameChange,
  handleNameCompositionStart,
  handleNameCompositionEnd,
  frequentTransactions,
  selectFrequentTransaction,
}: Props) {
  return (
    <form
      className="scrollbar-hidden mt-3 min-h-0 flex-1 overflow-y-auto pb-24 sm:mt-8 sm:block sm:overflow-visible sm:pb-0"
      id="transaction-form"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="space-y-4 sm:space-y-6">
        <FormSection>
          <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
            <PopoverTrigger asChild>
              <button
                aria-describedby={
                  errors.transactionDate
                    ? 'new-transaction-transactionDate-error'
                    : undefined
                }
                aria-invalid={errors.transactionDate ? true : undefined}
                aria-label="日付"
                className="flex min-h-12 w-full items-center gap-3 border-b px-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-16 sm:px-5"
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
              </button>
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
          <FormRow className="border-b">
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
          </FormRow>
          {errors.amount ? (
            <p
              id="new-transaction-amount-error"
              className="px-4 pb-3 text-sm text-destructive"
            >
              {errors.amount}
            </p>
          ) : null}
          <FormRow className="min-h-14 sm:min-h-16">
            <label
              className="text-sm font-medium sm:text-base"
              htmlFor="new-transaction-name"
            >
              取引名
            </label>
            <Input
              aria-describedby={
                errors.transactionName
                  ? 'new-transaction-transactionName-error'
                  : undefined
              }
              aria-invalid={errors.transactionName ? true : undefined}
              className="ml-auto h-11 max-w-64 text-right text-xl placeholder:text-muted-foreground/60"
              id="new-transaction-name"
              maxLength={32}
              onChange={(event) => handleNameChange(event.target.value)}
              onCompositionStart={handleNameCompositionStart}
              onCompositionEnd={(event) =>
                handleNameCompositionEnd(event.currentTarget.value)
              }
              placeholder="例: ランチ"
              value={form.transactionName}
            />
          </FormRow>
          {errors.transactionName ? (
            <p
              id="new-transaction-transactionName-error"
              className="px-4 pb-3 text-sm text-destructive"
            >
              {errors.transactionName}
            </p>
          ) : null}
          {recommendedTransactions.length ? (
            <section aria-label="おすすめ" className="px-4 pb-4 sm:px-5">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                おすすめ
              </h2>
              <div className="flex flex-wrap gap-2">
                {recommendedTransactions.map((transaction) => (
                  <TransactionCandidateChip
                    key={`${transaction.transaction_name}-${transaction.category_id}-${transaction.sub_category_id}`}
                    onSelect={selectFrequentTransaction}
                    transaction={transaction}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </FormSection>

        <FormSection>
          <button
            aria-describedby={
              errors.categoryId ||
              errors.subcategoryId ||
              errors.subcategoryName
                ? 'new-transaction-category-error'
                : undefined
            }
            aria-invalid={
              errors.categoryId ||
              errors.subcategoryId ||
              errors.subcategoryName
                ? true
                : undefined
            }
            className="flex min-h-20 w-full items-center gap-3 px-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:px-5"
            onClick={openCategorySelection}
            type="button"
          >
            <span className="text-sm font-medium sm:text-base">カテゴリ</span>
            <span className="ml-auto flex min-w-0 items-center gap-3 text-right">
              {selectedCategory ? (
                <CategoryIcon name={selectedCategory.category_name} />
              ) : null}
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-base font-medium sm:text-lg',
                    !selectedCategory && 'text-muted-foreground',
                  )}
                >
                  {selectedCategory?.category_name ?? '選択してください'}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block truncate text-xs sm:text-sm',
                    !selectedSubcategory &&
                      !form.subcategoryName &&
                      'text-muted-foreground',
                  )}
                >
                  {selectedSubcategory?.sub_category_name ??
                    (form.subcategoryName || 'サブカテゴリを選択')}
                </span>
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
            />
          </button>
          {errors.categoryId ||
          errors.subcategoryId ||
          errors.subcategoryName ? (
            <p
              className="px-4 pb-3 text-sm text-destructive"
              id="new-transaction-category-error"
              role="alert"
            >
              {errors.categoryId ??
                errors.subcategoryId ??
                errors.subcategoryName}
            </p>
          ) : null}
          <div className="border-t" />
          <FormRow>
            <span className="flex items-center gap-2 text-sm font-medium sm:text-base">
              固定費フラグ
              <Info
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </span>
            <button
              aria-checked={form.fixed}
              aria-label="固定費フラグ"
              className={cn(
                'ml-auto flex h-7 w-12 items-center rounded-full p-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                form.fixed
                  ? 'justify-end bg-primary'
                  : 'justify-start bg-muted-foreground/25',
              )}
              onClick={() => setValue('fixed', !form.fixed)}
              role="switch"
              type="button"
            >
              <span className="size-5 rounded-full bg-card shadow-sm" />
            </button>
          </FormRow>
        </FormSection>

        {payments.length ? (
          <FormSection>
            <button
              className="flex min-h-20 w-full items-center gap-3 px-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:px-5"
              onClick={() => setSelectionSheet('payment')}
              type="button"
            >
              <span className="text-sm font-medium sm:text-base">
                支払い方法
              </span>
              <span className="ml-auto flex min-w-0 items-center gap-3">
                {selectedPayment ? (
                  <PaymentIcon
                    paymentName={selectedPayment.payment_name}
                    paymentTypeName={paymentTypeNames.get(
                      selectedPayment.payment_type_id,
                    )}
                    sizeClassName="size-11"
                  />
                ) : null}
                <span
                  className={cn(
                    'truncate text-base font-medium sm:text-lg',
                    !selectedPayment && 'text-muted-foreground',
                  )}
                >
                  {paymentsError
                    ? '取得できませんでした'
                    : (selectedPayment?.payment_name ?? '選択しない')}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </button>
          </FormSection>
        ) : null}

        {frequentTransactions.length ? (
          <TransactionCandidates
            onOpenMore={() => setSelectionSheet('candidate')}
            onSelect={selectFrequentTransaction}
            transactions={frequentTransactions}
          />
        ) : null}
      </div>
    </form>
  )
}
