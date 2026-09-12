import { LoaderCircle, Trash2, Upload, X } from 'lucide-react'

import { ErrorState } from '@/shared/components/app-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

import { useTransactionFormController } from '../hooks/use-transaction-form-controller'
import { TransactionFormFields } from './transaction-form/transaction-form-fields'
import { TransactionSelectionSheets } from './transaction-form/transaction-selection-sheets'

export function TransactionFormView({
  transactionId,
}: { transactionId?: string } = {}) {
  const controller = useTransactionFormController(transactionId)
  const {
    isLoading,
    isEdit,
    hasError,
    error,
    retry,
    goBack,
    openCsvImport,
    isSaving,
    isDeleting,
    setDeleteDialogOpen,
    form,
    handleSignChange,
    transaction,
    deleteDialogOpen,
    handleDelete,
  } = controller

  if (isLoading) {
    return (
      <section
        aria-label={`取引${isEdit ? '編集' : '追加'}画面を読み込んでいます`}
        className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6"
        role="status"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="mt-8 h-14 rounded-2xl" />
        <Skeleton className="mt-7 h-56 rounded-2xl" />
        <Skeleton className="mt-6 h-44 rounded-2xl" />
      </section>
    )
  }

  if (hasError) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Button
            aria-label="前の画面へ戻る"
            onClick={goBack}
            size="icon-lg"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-7" />
          </Button>
          <h1
            className="text-lg font-semibold tracking-[-0.04em] sm:text-xl"
            id="transaction-page-title"
          >
            取引を{isEdit ? '編集' : '追加'}
          </h1>
          <span className="w-9" />
        </header>
        <div className="mt-10">
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : isEdit
                  ? '取引データを取得できませんでした。'
                  : 'カテゴリを取得できませんでした。'
            }
            onRetry={() => void retry()}
            title={`取引を${isEdit ? '編集' : '追加'}できません`}
          />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="transaction-page-title"
      className="motion-route-enter mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden px-4 pt-3 sm:block sm:h-auto sm:overflow-visible sm:px-6 sm:pt-7 sm:pb-10"
    >
      <div className="shrink-0">
        <header className="flex items-center justify-between gap-2 sm:gap-3">
          <Button
            aria-label="前の画面へ戻る"
            className="size-8 sm:size-9"
            onClick={goBack}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-6 sm:size-7" />
          </Button>
          <h1
            className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl"
            id="transaction-page-title"
          >
            取引を{isEdit ? '編集' : '追加'}
          </h1>
          <div className="flex items-center gap-1">
            {isEdit ? (
              <Button
                aria-label="取引を削除"
                className="size-8 sm:size-9"
                disabled={isSaving || isDeleting}
                onClick={() => setDeleteDialogOpen(true)}
                size="icon"
                type="button"
                variant="destructive"
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="CSV取引をインポート"
                    className="size-8 sm:size-9"
                    onClick={openCsvImport}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Upload aria-hidden="true" className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  CSV取引をインポート
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        <div
          aria-label="取引区分"
          className="mt-3 grid grid-cols-2 rounded-2xl bg-muted p-0.5 sm:mt-8 sm:p-1.5"
          role="tablist"
        >
          {[
            { sign: -1 as const, label: '支出' },
            { sign: 1 as const, label: '収入' },
          ].map((item) => {
            const isSelected = form.sign === item.sign
            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'min-h-10 rounded-xl px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-12 sm:px-4 sm:text-base',
                  isSelected
                    ? item.sign === -1
                      ? 'bg-card text-expense shadow-sm'
                      : 'bg-card text-income shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={item.sign}
                onClick={() => handleSignChange(item.sign)}
                role="tab"
                type="button"
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <TransactionFormFields
        handleSubmit={controller.handleSubmit}
        setDatePickerOpen={controller.setDatePickerOpen}
        datePickerOpen={controller.datePickerOpen}
        errors={controller.errors}
        selectedDate={controller.selectedDate}
        setValue={controller.setValue}
        form={controller.form}
        openCategorySelection={controller.openCategorySelection}
        selectedCategory={controller.selectedCategory}
        selectedSubcategory={controller.selectedSubcategory}
        payments={controller.payments}
        setSelectionSheet={controller.setSelectionSheet}
        selectedPayment={controller.selectedPayment}
        paymentTypeNames={controller.paymentTypeNames}
        paymentsError={controller.paymentsError}
        frequentTransactions={controller.frequentTransactions}
        selectFrequentTransaction={controller.selectFrequentTransaction}
      />
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 sm:static sm:mt-6 sm:flex sm:justify-end">
        <Button
          className="h-12 rounded-full px-5 text-base shadow-lg sm:px-7 sm:rounded-lg sm:shadow-none"
          disabled={isSaving || isDeleting}
          form="transaction-form"
          size="lg"
          type="submit"
        >
          {isSaving ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : null}
          保存
        </Button>
      </div>

      <TransactionSelectionSheets
        selectionSheet={controller.selectionSheet}
        setSelectionSheet={controller.setSelectionSheet}
        frequentTransactions={controller.frequentTransactions}
        selectFrequentTransaction={controller.selectFrequentTransaction}
        setCategorySelectionStep={controller.setCategorySelectionStep}
        categorySelectionStep={controller.categorySelectionStep}
        categories={controller.categories}
        form={controller.form}
        selectCategory={controller.selectCategory}
        selectedCategory={controller.selectedCategory}
        enabledSubcategories={controller.enabledSubcategories}
        setValue={controller.setValue}
        payments={controller.payments}
        paymentTypeNames={controller.paymentTypeNames}
      />

      {isEdit && transaction ? (
        <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>この取引を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{transaction.transaction_name}」{' '}
                {transaction.amount.toLocaleString('ja-JP')}
                円の取引を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="mr-1.5 size-4 animate-spin"
                  />
                ) : null}
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </section>
  )
}
