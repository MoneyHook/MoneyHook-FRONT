import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'
import { TransactionCandidateChip } from '../transaction-candidates'
import { CategoryIcon, PaymentIcon } from './transaction-form-icons'

function SheetOption({
  children,
  isSelected,
  onClick,
}: {
  children: React.ReactNode
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        isSelected && 'bg-accent text-accent-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
      {isSelected ? (
        <Check aria-hidden="true" className="ml-auto size-5 text-primary" />
      ) : null}
    </button>
  )
}

type Props = Pick<
  TransactionFormController,
  | 'selectionSheet'
  | 'setSelectionSheet'
  | 'frequentTransactions'
  | 'selectFrequentTransaction'
  | 'setCategorySelectionStep'
  | 'categorySelectionStep'
  | 'categories'
  | 'form'
  | 'selectCategory'
  | 'selectedCategory'
  | 'enabledSubcategories'
  | 'setValue'
  | 'payments'
  | 'paymentTypeNames'
  | 'isEdit'
  | 'errors'
  | 'confirmNewSubcategory'
  | 'newSubcategoryName'
  | 'changeNewSubcategoryName'
>

type SubcategorySelectionProps = Pick<
  Props,
  | 'form'
  | 'setCategorySelectionStep'
  | 'selectedCategory'
  | 'enabledSubcategories'
  | 'setValue'
  | 'setSelectionSheet'
  | 'isEdit'
  | 'errors'
  | 'confirmNewSubcategory'
  | 'newSubcategoryName'
  | 'changeNewSubcategoryName'
>

function SubcategorySelection({
  form,
  setCategorySelectionStep,
  selectedCategory,
  enabledSubcategories,
  setValue,
  setSelectionSheet,
  isEdit,
  errors,
  confirmNewSubcategory,
  newSubcategoryName,
  changeNewSubcategoryName,
}: SubcategorySelectionProps) {
  const [isCreatingNewSubcategory, setIsCreatingNewSubcategory] =
    useState(false)

  return (
    <div className="animate-in duration-150 fade-in slide-in-from-right-2">
      <SheetHeader className="border-b px-5 py-4 text-left">
        <Button
          aria-label="カテゴリ選択へ戻る"
          className="mb-1 -ml-2 w-fit"
          onClick={() => setCategorySelectionStep('category')}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" /> カテゴリ
        </Button>
        <SheetTitle>サブカテゴリを選択</SheetTitle>
        <SheetDescription>
          {selectedCategory?.category_name ?? 'カテゴリ'}
          のサブカテゴリを選択してください。
        </SheetDescription>
      </SheetHeader>
      <div className="p-2">
        {enabledSubcategories.length ? (
          enabledSubcategories.map((subcategory) => (
            <SheetOption
              isSelected={form.subcategoryId === subcategory.sub_category_id}
              key={subcategory.sub_category_id}
              onClick={() => {
                setValue('subcategoryId', subcategory.sub_category_id)
                setValue('subcategoryName', '')
                setSelectionSheet(null)
                setCategorySelectionStep('category')
              }}
            >
              <span className="font-medium">
                {subcategory.sub_category_name}
              </span>
            </SheetOption>
          ))
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            選択できるサブカテゴリがありません。
          </p>
        )}
        {!isEdit ? (
          <div className="mt-2 space-y-2">
            {isCreatingNewSubcategory ? (
              <>
                <div
                  className={cn(
                    'flex h-14 w-full items-center border-b border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
                    errors.subcategoryName &&
                      'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
                  )}
                >
                  <label className="sr-only" htmlFor="new-subcategory-name">
                    サブカテゴリ名
                  </label>
                  <Input
                    aria-describedby={
                      errors.subcategoryName
                        ? 'new-subcategory-name-error'
                        : undefined
                    }
                    aria-invalid={errors.subcategoryName ? true : undefined}
                    autoFocus
                    className="h-full rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
                    id="new-subcategory-name"
                    maxLength={16}
                    onChange={(event) =>
                      changeNewSubcategoryName(event.target.value)
                    }
                    placeholder="例: カフェ"
                    value={newSubcategoryName}
                  />
                  <Button
                    aria-label="登録"
                    className="mr-1 shrink-0"
                    onClick={confirmNewSubcategory}
                    type="button"
                  >
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
                {errors.subcategoryName ? (
                  <p
                    className="px-1 text-sm text-destructive"
                    id="new-subcategory-name-error"
                  >
                    {errors.subcategoryName}
                  </p>
                ) : null}
              </>
            ) : (
              <Button
                className="min-h-14 w-full justify-start"
                onClick={() => {
                  changeNewSubcategoryName(form.subcategoryName)
                  setIsCreatingNewSubcategory(true)
                }}
                type="button"
                variant="ghost"
              >
                <Plus aria-hidden="true" />
                新しいサブカテゴリを作成
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function TransactionSelectionSheets({
  selectionSheet,
  setSelectionSheet,
  frequentTransactions,
  selectFrequentTransaction,
  setCategorySelectionStep,
  categorySelectionStep,
  categories,
  form,
  selectCategory,
  selectedCategory,
  enabledSubcategories,
  setValue,
  payments,
  paymentTypeNames,
  isEdit,
  errors,
  confirmNewSubcategory,
  newSubcategoryName,
  changeNewSubcategoryName,
}: Props) {
  return (
    <>
      <Sheet
        onOpenChange={(open) => !open && setSelectionSheet(null)}
        open={selectionSheet === 'candidate'}
      >
        <SheetContent
          className="max-h-[85svh] overflow-hidden rounded-t-3xl p-0"
          showCloseButton={false}
          side="bottom"
        >
          <SheetHeader className="shrink-0 border-b px-5 py-4 text-left">
            <SheetTitle>おすすめをすべて表示</SheetTitle>
            <SheetDescription>すべての候補から選択できます</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {frequentTransactions.slice(0, 30).map((transaction) => (
                <TransactionCandidateChip
                  key={`${transaction.transaction_name}-${transaction.category_id}-${transaction.sub_category_id}`}
                  onSelect={(selectedTransaction) => {
                    selectFrequentTransaction(selectedTransaction)
                    setSelectionSheet(null)
                  }}
                  transaction={transaction}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            setSelectionSheet(null)
            setCategorySelectionStep('category')
          }
        }}
        open={selectionSheet === 'category'}
      >
        <SheetContent
          className="max-h-[85svh] overflow-y-auto rounded-t-3xl p-0"
          showCloseButton={false}
          side="bottom"
        >
          {categorySelectionStep === 'category' ? (
            <div className="animate-in duration-150 fade-in slide-in-from-left-2">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle>カテゴリを選択</SheetTitle>
                <SheetDescription>
                  取引のカテゴリを選択してください。
                </SheetDescription>
              </SheetHeader>
              <div className="p-2">
                {categories.map((category) => (
                  <SheetOption
                    isSelected={form.categoryId === category.category_id}
                    key={category.category_id}
                    onClick={() => selectCategory(category.category_id)}
                  >
                    <CategoryIcon name={category.category_name} />
                    <span className="font-medium">
                      {category.category_name}
                    </span>
                  </SheetOption>
                ))}
              </div>
            </div>
          ) : categorySelectionStep === 'subcategory' ? (
            <SubcategorySelection
              changeNewSubcategoryName={changeNewSubcategoryName}
              confirmNewSubcategory={confirmNewSubcategory}
              enabledSubcategories={enabledSubcategories}
              errors={errors}
              form={form}
              isEdit={isEdit}
              newSubcategoryName={newSubcategoryName}
              selectedCategory={selectedCategory}
              setCategorySelectionStep={setCategorySelectionStep}
              setSelectionSheet={setSelectionSheet}
              setValue={setValue}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={(open) => !open && setSelectionSheet(null)}
        open={selectionSheet === 'payment'}
      >
        <SheetContent
          className="max-h-[85svh] overflow-y-auto rounded-t-3xl p-0"
          showCloseButton={false}
          side="bottom"
        >
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>支払い方法を選択</SheetTitle>
            <SheetDescription>支払い方法は任意です。</SheetDescription>
          </SheetHeader>
          <div className="p-2">
            <SheetOption
              isSelected={form.paymentId === null}
              onClick={() => {
                setValue('paymentId', null)
                setSelectionSheet(null)
              }}
            >
              <span className="font-medium">選択しない</span>
            </SheetOption>
            {payments.map((payment) => (
              <SheetOption
                isSelected={form.paymentId === payment.payment_id}
                key={payment.payment_id}
                onClick={() => {
                  setValue('paymentId', payment.payment_id)
                  setSelectionSheet(null)
                }}
              >
                <PaymentIcon
                  paymentName={payment.payment_name}
                  paymentTypeName={paymentTypeNames.get(
                    payment.payment_type_id,
                  )}
                  sizeClassName="size-10"
                />
                <span className="font-medium">{payment.payment_name}</span>
              </SheetOption>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
