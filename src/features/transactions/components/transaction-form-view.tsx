import { ChevronDown, LoaderCircle, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

import { useTransactionFormController } from '../hooks/use-transaction-form-controller'
import type { TransactionFormExtension } from '../model/form-extension'
import { TransactionFormFields } from './transaction-form/transaction-form-fields'
import { TransactionFormSkeleton } from './transaction-form/transaction-form-skeleton'
import { TransactionSelectionSheets } from './transaction-form/transaction-selection-sheets'

export function TransactionFormView({
  transactionId,
  extension = {},
}: { transactionId?: string; extension?: TransactionFormExtension } = {}) {
  useEffect(() => {
    if (transactionId) {
      return
    }

    document.body.classList.add('transaction-form-scrollbar-hidden')
    return () =>
      document.body.classList.remove('transaction-form-scrollbar-hidden')
  }, [transactionId])

  const controller = useTransactionFormController(transactionId, extension)
  const saveDetailsRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (extension.saveMode?.value === 'proxy' && !isLoading) {
      saveDetailsRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }
  }, [extension.saveMode?.value, isLoading])

  if (isLoading) {
    return (
      <TransactionFormSkeleton
        isEdit={isEdit}
        showCandidates={!isEdit && !extension.references}
      />
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
      className={cn(
        'mx-auto w-full max-w-2xl px-4 pt-3 sm:block sm:h-auto sm:overflow-visible sm:px-6 sm:pt-7 sm:pb-10',
        extension.renderOptions
          ? 'min-h-dvh pb-24'
          : 'motion-route-enter flex h-dvh flex-col overflow-hidden',
      )}
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
          {!isEdit && extension.renderTitle ? (
            extension.renderTitle(controller.resetReferences, isSaving)
          ) : (
            <h1
              className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl"
              id="transaction-page-title"
            >
              取引を{isEdit ? '編集' : '追加'}
            </h1>
          )}
          <div className="flex min-w-8 items-center gap-1 sm:min-w-9">
            {isEdit ? (
              <Button
                aria-label="取引を削除"
                className="size-8 sm:size-9"
                disabled={isSaving || isDeleting || extension.isBlocked}
                onClick={() => setDeleteDialogOpen(true)}
                size="icon"
                type="button"
                variant="destructive"
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </Button>
            ) : extension.allowCsvImport !== false ? (
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
            ) : null}
          </div>
        </header>

        <RadioGroup
          aria-label="取引区分"
          className="mt-3 grid grid-cols-2 rounded-2xl bg-muted-foreground/10 p-0.5 sm:mt-8 sm:p-1.5"
          onValueChange={(value) => handleSignChange(Number(value) as -1 | 1)}
          value={String(form.sign)}
        >
          {[
            { sign: -1 as const, label: '支出' },
            { sign: 1 as const, label: '収入' },
          ].map((item) => {
            const isSelected = form.sign === item.sign
            return (
              <div className="relative" key={item.sign}>
                <RadioGroupItem
                  className="peer sr-only"
                  id={`transaction-sign-${item.sign}`}
                  value={String(item.sign)}
                />
                <label
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 sm:min-h-12 sm:px-4 sm:text-base',
                    isSelected
                      ? item.sign === -1
                        ? 'bg-card text-expense shadow-sm'
                        : 'bg-card text-income shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  htmlFor={`transaction-sign-${item.sign}`}
                >
                  {item.label}
                </label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {extension.renderOptions?.(form, controller.resetReferences)}
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
        recommendedTransactions={controller.recommendedTransactions}
        isEdit={controller.isEdit}
        isLoadingRecommendations={controller.isLoadingRecommendations}
        recommendationsError={controller.recommendationsError}
        handleNameChange={controller.handleNameChange}
        handleNameCompositionStart={controller.handleNameCompositionStart}
        handleNameCompositionEnd={controller.handleNameCompositionEnd}
        frequentTransactions={controller.frequentTransactions}
        selectFrequentTransaction={controller.selectFrequentTransaction}
      >
        {extension.saveMode?.renderDetails && (
          <div ref={saveDetailsRef}>{extension.saveMode.renderDetails()}</div>
        )}
      </TransactionFormFields>
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 sm:static sm:mt-6 sm:flex sm:justify-end">
        <div
          className="flex w-full rounded-full shadow-lg sm:w-auto sm:rounded-lg sm:shadow-none"
          role={extension.saveMode ? 'group' : undefined}
          aria-label={extension.saveMode ? '取引の保存' : undefined}
        >
          <Button
            className={cn(
              'h-12 min-w-0 flex-1 rounded-full px-5 text-base sm:flex-none sm:rounded-lg sm:px-7',
              extension.saveMode && 'rounded-r-none sm:rounded-r-none',
            )}
            disabled={isSaving || isDeleting || extension.isBlocked}
            form="transaction-form"
            size="lg"
            type="submit"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : null}
            {extension.saveMode?.value === 'proxy' ? '代理記録で保存' : '保存'}
          </Button>
          {!isEdit && extension.saveMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="保存方法を選択"
                  className="h-12 w-12 rounded-l-none rounded-r-full border-l border-primary-foreground/25 p-0 sm:rounded-r-lg"
                  disabled={isSaving || isDeleting || extension.isBlocked}
                  type="button"
                >
                  <ChevronDown aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 max-w-[calc(100vw-2rem)] p-1.5"
                sideOffset={8}
              >
                <DropdownMenuRadioGroup
                  value={extension.saveMode.value}
                  onValueChange={(value) => {
                    if (value === 'normal' || value === 'proxy') {
                      extension.saveMode?.onChange(
                        value,
                        controller.resetReferences,
                      )
                    }
                  }}
                >
                  {[
                    {
                      value: 'normal',
                      label: '通常保存',
                      description: '自分の取引を個人と家族に保存',
                    },
                    {
                      value: 'proxy',
                      label: '代理記録で保存',
                      description: '家族共通・他のメンバーの取引を家族に保存',
                    },
                  ].map((mode) => (
                    <DropdownMenuRadioItem
                      key={mode.value}
                      value={mode.value}
                      className="items-start py-3 pr-3 pl-9 [&_[data-slot=dropdown-menu-radio-item-indicator]]:top-3.5 [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-auto [&_[data-slot=dropdown-menu-radio-item-indicator]]:left-3"
                    >
                      <span className="grid gap-1">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs leading-relaxed text-muted-foreground">
                          {mode.description}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
        isEdit={controller.isEdit || Boolean(extension.references)}
        errors={controller.errors}
        confirmNewSubcategory={controller.confirmNewSubcategory}
        newSubcategoryName={controller.newSubcategoryName}
        changeNewSubcategoryName={controller.changeNewSubcategoryName}
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
                {transaction.shared &&
                  ' 家族の共有一覧からも削除されます。退出時に残した控えは変更されません。'}
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
