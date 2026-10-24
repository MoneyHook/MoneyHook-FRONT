import { ChevronRight, Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { cn } from '@/shared/lib/utils'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'
import { TransactionCandidates } from '../transaction-candidates'
import {
  TransactionBasicFields,
  TransactionFormRow as FormRow,
  TransactionFormSection as FormSection,
} from './transaction-basic-fields'
import { CategoryIcon, PaymentIcon } from './transaction-form-icons'

type Props = { children?: ReactNode } & Pick<
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
  | 'isEdit'
  | 'isLoadingRecommendations'
  | 'recommendationsError'
  | 'handleNameChange'
  | 'handleNameCompositionStart'
  | 'handleNameCompositionEnd'
  | 'frequentTransactions'
  | 'selectFrequentTransaction'
>

export function TransactionFormFields({
  children,
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
  isEdit,
  isLoadingRecommendations,
  recommendationsError,
  handleNameChange,
  handleNameCompositionStart,
  handleNameCompositionEnd,
  frequentTransactions,
  selectFrequentTransaction,
}: Props) {
  return (
    <form
      className="motion-route-enter mt-3 sm:mt-8"
      id="transaction-form"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="space-y-4 sm:space-y-6">
        <TransactionBasicFields
          setDatePickerOpen={setDatePickerOpen}
          datePickerOpen={datePickerOpen}
          errors={errors}
          selectedDate={selectedDate}
          setValue={setValue}
          form={form}
          payments={payments}
          recommendedTransactions={recommendedTransactions}
          isEdit={isEdit}
          isLoadingRecommendations={isLoadingRecommendations}
          recommendationsError={recommendationsError}
          handleNameChange={handleNameChange}
          handleNameCompositionStart={handleNameCompositionStart}
          handleNameCompositionEnd={handleNameCompositionEnd}
          selectFrequentTransaction={selectFrequentTransaction}
        />

        <FormSection>
          <Button
            variant="ghost"
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
            className="flex h-auto min-h-20 w-full items-center justify-start gap-3 rounded-none border-0 px-4 py-0 text-left font-normal whitespace-normal transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 sm:min-h-28 sm:px-5 dark:hover:bg-muted/60"
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
          </Button>
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
            <Switch
              aria-label="固定費フラグ"
              checked={form.fixed}
              className="ml-auto h-7 w-12 border-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/25 [&_[data-slot=switch-thumb]]:size-5 [&_[data-slot=switch-thumb]]:translate-x-1 [&_[data-slot=switch-thumb]]:bg-card [&_[data-slot=switch-thumb][data-state=checked]]:translate-x-6"
              onCheckedChange={(checked) => setValue('fixed', checked)}
            />
          </FormRow>
        </FormSection>

        {payments.length ? (
          <FormSection>
            <Button
              variant="ghost"
              className="flex h-auto min-h-20 w-full items-center justify-start gap-3 rounded-none border-0 px-4 py-0 text-left font-normal whitespace-normal transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 sm:min-h-28 sm:px-5 dark:hover:bg-muted/60"
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
            </Button>
          </FormSection>
        ) : null}

        {frequentTransactions.length ? (
          <TransactionCandidates
            onOpenMore={() => setSelectionSheet('candidate')}
            onSelect={selectFrequentTransaction}
            transactions={frequentTransactions}
          />
        ) : null}
        {children}
      </div>
    </form>
  )
}
