import { ArrowLeft, Check } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

import { TransactionCandidateChip } from '../transaction-candidates'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'
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
        'flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        isSelected && 'bg-accent text-accent-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
      {isSelected ? <Check aria-hidden="true" className="ml-auto size-5 text-primary" /> : null}
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
>

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
              {frequentTransactions.map((transaction) => (
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
            <div className="animate-in fade-in slide-in-from-left-2 duration-150">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle>カテゴリを選択</SheetTitle>
                <SheetDescription>取引のカテゴリを選択してください。</SheetDescription>
              </SheetHeader>
              <div className="p-2">
                {categories.map((category) => (
                  <SheetOption
                    isSelected={form.categoryId === category.category_id}
                    key={category.category_id}
                    onClick={() => selectCategory(category.category_id)}
                  >
                    <CategoryIcon name={category.category_name} />
                    <span className="font-medium">{category.category_name}</span>
                  </SheetOption>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-2 duration-150">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <Button
                  aria-label="カテゴリ選択へ戻る"
                  className="-ml-2 mb-1 w-fit"
                  onClick={() => setCategorySelectionStep('category')}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeft aria-hidden="true" /> カテゴリ
                </Button>
                <SheetTitle>サブカテゴリを選択</SheetTitle>
                <SheetDescription>
                  {selectedCategory?.category_name ?? 'カテゴリ'}のサブカテゴリを選択してください。
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
                        setSelectionSheet(null)
                        setCategorySelectionStep('category')
                      }}
                    >
                      <span className="font-medium">{subcategory.sub_category_name}</span>
                    </SheetOption>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    選択できるサブカテゴリがありません。
                  </p>
                )}
              </div>
            </div>
          )}
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
                  paymentTypeName={paymentTypeNames.get(payment.payment_type_id)}
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
