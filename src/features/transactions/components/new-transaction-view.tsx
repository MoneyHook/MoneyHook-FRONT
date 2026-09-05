import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Info,
  LoaderCircle,
  Trash2,
  X,
} from 'lucide-react'
import { ja } from 'react-day-picker/locale'
import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  getGetTimelineDataQueryKey,
  getGetFrequentTransactionNamesQueryKey,
  getGetV1TransactionQueryKey,
  useCreateV1Transaction,
  useDeleteV1Transaction,
  useGetV1Transaction,
  useUpdateV1Transaction,
} from '@/shared/api/generated/transaction/transaction'
import { ErrorState } from '@/shared/components/app-state'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { getPaymentIconSource } from '@/shared/lib/payment-icon'
import { cn } from '@/shared/lib/utils'

import { TransactionCandidateChip, TransactionCandidates } from './transaction-candidates'
import { useTransactionFormReferences } from '../api/use-transaction-form-references'
import {
  createNewTransactionValues,
  validateNewTransaction,
  type NewTransactionErrors,
  type NewTransactionFormValues,
  type NewTransactionSign,
} from '../model/new-transaction'

type SelectionSheet = 'category' | 'payment' | 'candidate' | null
type CategorySelectionStep = 'category' | 'subcategory'

type TransactionNavigationState = {
  returnTo?: unknown
}

function getReturnTo(state: unknown, fallback: string) {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) {
    return fallback
  }

  const value = (state as TransactionNavigationState).returnTo
  if (typeof value !== 'string' || !value.startsWith('/app/') || value.includes('\\')) {
    return fallback
  }

  return value
}

function getTransactionMonth(date: string) {
  return `${date.slice(0, 7)}-01`
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return undefined
  }

  const [, yearString, monthString, dayString] = match
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined
}

function formatCalendarDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function transactionQueryPrefix() {
  return [
    '/api/v1/analytics/overview',
    '/api/v1/analytics/categories',
    '/api/v1/analytics/fixed',
    '/api/v1/analytics/payments',
    '/api/transaction/getHome',
    '/api/transaction/getTimelineData',
  ] as const
}

async function invalidateTransactionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  ...dates: string[]
) {
  const months = [...new Set(dates.map(getTransactionMonth))]
  await Promise.all([
    ...months.map((month) =>
      queryClient.invalidateQueries({
        queryKey: getGetTimelineDataQueryKey({ month }),
      }),
    ),
    ...transactionQueryPrefix().map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] }),
    ),
  ])
}

function FormSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_4%,transparent)]',
        className,
      )}
    >
      {children}
    </section>
  )
}

function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex min-h-12 items-center gap-3 px-4 sm:min-h-16 sm:px-5', className)}>{children}</div>
}

function CategoryIcon({ name, iconSizeClassName = 'size-5', sizeClassName = 'size-11' }: { name: string; iconSizeClassName?: string; sizeClassName?: string }) {
  const presentation = getCategoryPresentation(name)
  const Icon = presentation.icon

  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full', sizeClassName, presentation.iconClassName)}>
      <Icon aria-hidden="true" className={iconSizeClassName} />
    </span>
  )
}

function PaymentIcon({
  paymentName,
  paymentTypeName,
  sizeClassName,
}: {
  paymentName: string
  paymentTypeName?: string | null
  sizeClassName: string
}) {
  const iconSource = getPaymentIconSource({ paymentName, paymentTypeName })

  return iconSource ? (
    <img alt="" className={cn('shrink-0 rounded-full', sizeClassName)} height="44" src={iconSource} width="44" />
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-chart-2/12 text-chart-2', sizeClassName)}>
      <CreditCard aria-hidden="true" className="size-5" />
    </span>
  )
}

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

export function TransactionFormView({ transactionId }: { transactionId?: string } = {}) {
  const isEdit = Boolean(transactionId)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { categoriesQuery, paymentsQuery, paymentTypesQuery, frequentTransactionsQuery } =
    useTransactionFormReferences({ isEdit })
  const transactionQuery = useGetV1Transaction(transactionId ?? '', {
    query: { enabled: isEdit },
  })
  const createMutation = useCreateV1Transaction()
  const updateMutation = useUpdateV1Transaction()
  const deleteMutation = useDeleteV1Transaction()
  const transaction =
    transactionQuery.data?.status === 200
      ? transactionQuery.data.data.transaction
      : null
  const initialForm = useMemo<NewTransactionFormValues>(
    () =>
      transaction
        ? {
            transactionDate: transaction.transaction_date,
            transactionTime: transaction.transaction_time,
            amount: String(transaction.amount),
            transactionName: transaction.transaction_name,
            sign: transaction.sign,
            categoryId: transaction.category_id,
            subcategoryId: transaction.sub_category_id,
            fixed: transaction.fixed_flg,
            paymentId: transaction.payment_id,
          }
        : createNewTransactionValues(),
    [transaction],
  )
  const [formOverride, setFormOverride] = useState<NewTransactionFormValues | null>(null)
  const form = formOverride ?? initialForm
  const [errors, setErrors] = useState<NewTransactionErrors>({})
  const [selectionSheet, setSelectionSheet] = useState<SelectionSheet>(null)
  const [categorySelectionStep, setCategorySelectionStep] = useState<CategorySelectionStep>('category')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const fallbackReturnTo = transaction
    ? `/app/transactions?month=${getTransactionMonth(transaction.transaction_date)}&view=list`
    : '/app/transactions'
  const returnTo = getReturnTo(location.state, fallbackReturnTo)

  const categories =
    categoriesQuery.data?.status === 200 ? categoriesQuery.data.data.category_list ?? [] : []
  const payments =
    paymentsQuery.data?.status === 200 ? paymentsQuery.data.data.payment_list : []
  const paymentTypeNames = useMemo(
    () => new Map(
      paymentTypesQuery.data?.status === 200
        ? paymentTypesQuery.data.data.payment_type_list.map((type) => [type.payment_type_id, type.payment_type_name])
        : [],
    ),
    [paymentTypesQuery.data],
  )
  const selectedCategory = categories.find((category) => category.category_id === form.categoryId)
  const enabledSubcategories = (selectedCategory?.sub_category_list ?? []).filter(
    (subcategory) => subcategory.enable,
  )
  const selectedSubcategory = enabledSubcategories.find(
    (subcategory) => subcategory.sub_category_id === form.subcategoryId,
  )
  const selectedPayment = payments.find((payment) => payment.payment_id === form.paymentId)
  const selectedDate = parseCalendarDate(form.transactionDate)
  const frequentTransactions =
    frequentTransactionsQuery.data?.status === 200
      ? frequentTransactionsQuery.data.data.transaction_list
      : []

  const setValue = <K extends keyof NewTransactionFormValues>(
    key: K,
    value: NewTransactionFormValues[K],
  ) => {
    setFormOverride((current) => ({ ...(current ?? initialForm), [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const selectCategory = (categoryId: string) => {
    setFormOverride((current) => ({ ...(current ?? initialForm), categoryId, subcategoryId: '' }))
    setErrors((current) => ({ ...current, categoryId: undefined, subcategoryId: undefined }))
    setCategorySelectionStep('subcategory')
  }

  const selectFrequentTransaction = (transaction: (typeof frequentTransactions)[number]) => {
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      transactionName: transaction.transaction_name,
      categoryId: transaction.category_id,
      subcategoryId: transaction.sub_category_id,
      fixed: transaction.fixed_flg,
      paymentId: transaction.payment_id,
    }))
    setErrors((current) => ({
      ...current,
      transactionName: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
    }))
  }

  const openCategorySelection = () => {
    setCategorySelectionStep('category')
    setSelectionSheet('category')
  }

  const handleSignChange = (sign: NewTransactionSign) => {
    setValue('sign', sign)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateNewTransaction(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      return
    }

    try {
      if (isEdit && transactionId) {
        const response = await updateMutation.mutateAsync({
          transactionId,
          data: {
            transaction: {
              transaction_date: form.transactionDate,
              transaction_time: form.transactionTime,
              transaction_name: form.transactionName.trim(),
              amount: Number(form.amount),
              sign: form.sign,
              category_id: form.categoryId,
              sub_category_id: form.subcategoryId,
              fixed_flg: form.fixed,
              payment_id: form.paymentId,
            },
          },
        })
        if (response.status !== 200) {
          throw new Error('取引を保存できませんでした。もう一度お試しください。')
        }

        await invalidateTransactionQueries(
          queryClient,
          response.data.previous_transaction_date,
          form.transactionDate,
        )
        await queryClient.invalidateQueries({
          queryKey: getGetV1TransactionQueryKey(transactionId),
        })
        toast.success('取引を更新しました。')
        navigate(returnTo, { replace: true })
        return
      }

      const response = await createMutation.mutateAsync({
        data: {
          transaction: {
            transaction_date: form.transactionDate,
            transaction_name: form.transactionName.trim(),
            amount: Number(form.amount),
            sign: form.sign,
            category_id: form.categoryId,
            sub_category_id: form.subcategoryId,
            fixed_flg: form.fixed,
            payment_id: form.paymentId,
          },
        },
      })
      if (response.status !== 201) {
        throw new Error('取引を保存できませんでした。もう一度お試しください。')
      }

      const month = getTransactionMonth(form.transactionDate)
      await queryClient.invalidateQueries({
        queryKey: getGetTimelineDataQueryKey({ month }),
      })
      await queryClient.invalidateQueries({ queryKey: getGetFrequentTransactionNamesQueryKey() })
      toast.success('取引を保存しました。')
      navigate(`/app/transactions?month=${month}&view=list`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取引を保存できませんでした。')
    }
  }

  const handleDelete = async () => {
    if (!transactionId || !transaction) {
      return
    }

    try {
      const response = await deleteMutation.mutateAsync({ transactionId })
      if (response.status !== 204) {
        throw new Error('取引を削除できませんでした。もう一度お試しください。')
      }

      await invalidateTransactionQueries(queryClient, transaction.transaction_date)
      queryClient.removeQueries({ queryKey: getGetV1TransactionQueryKey(transactionId) })
      setDeleteDialogOpen(false)
      toast.success('取引を削除しました。')
      navigate(returnTo, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取引を削除できませんでした。')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending
  const isLoading = categoriesQuery.isPending || (isEdit && transactionQuery.isPending)

  if (isLoading) {
    return (
      <section aria-label={`取引${isEdit ? '編集' : '追加'}画面を読み込んでいます`} className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6" role="status">
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

  if (
    (categoriesQuery.isError && !categoriesQuery.data) ||
    (isEdit && (transactionQuery.isError || !transaction))
  ) {
    const error = transactionQuery.isError ? transactionQuery.error : categoriesQuery.error
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Button aria-label="前の画面へ戻る" onClick={() => navigate(returnTo)} size="icon-lg" variant="ghost">
            <X aria-hidden="true" className="size-7" />
          </Button>
          <h1 className="text-lg font-semibold tracking-[-0.04em] sm:text-xl" id="transaction-page-title">取引を{isEdit ? '編集' : '追加'}</h1>
          <span className="w-9" />
        </header>
        <div className="mt-10">
          <ErrorState
            message={error instanceof Error ? error.message : isEdit ? '取引データを取得できませんでした。' : 'カテゴリを取得できませんでした。'}
            onRetry={() => void (transactionQuery.isError ? transactionQuery.refetch() : categoriesQuery.refetch())}
            title={`取引を${isEdit ? '編集' : '追加'}できません`}
          />
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="transaction-page-title" className="motion-route-enter mx-auto flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden px-4 pt-3 sm:block sm:h-auto sm:overflow-visible sm:px-6 sm:pb-10 sm:pt-7">
      <div className="shrink-0">
        <header className="flex items-center justify-between gap-2 sm:gap-3">
          <Button aria-label="前の画面へ戻る" className="size-8 sm:size-9" onClick={() => navigate(returnTo)} size="icon" variant="ghost">
            <X aria-hidden="true" className="size-6 sm:size-7" />
          </Button>
          <h1 className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl" id="transaction-page-title">取引を{isEdit ? '編集' : '追加'}</h1>
          <div className="flex items-center gap-1">
            {isEdit ? (
              <Button aria-label="取引を削除" className="size-8 sm:size-9" disabled={isSaving || isDeleting} onClick={() => setDeleteDialogOpen(true)} size="icon" type="button" variant="destructive">
                <Trash2 aria-hidden="true" className="size-5" />
              </Button>
            ) : null}
          </div>
        </header>

        <div aria-label="取引区分" className="mt-3 grid grid-cols-2 rounded-2xl bg-muted p-0.5 sm:mt-8 sm:p-1.5" role="tablist">
          {([
            { sign: -1 as const, label: '支出' },
            { sign: 1 as const, label: '収入' },
          ]).map((item) => {
            const isSelected = form.sign === item.sign
            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'min-h-10 rounded-xl px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-12 sm:px-4 sm:text-base',
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

      <form className="mt-3 min-h-0 flex-1 overflow-y-auto pb-24 sm:mt-8 sm:block sm:overflow-visible sm:pb-0" id="transaction-form" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <div className="space-y-4 sm:space-y-6">
        <FormSection>
          <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
            <PopoverTrigger asChild>
              <button
                aria-invalid={errors.transactionDate ? true : undefined}
                aria-label="日付"
                className="flex min-h-12 w-full items-center gap-3 border-b px-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-16 sm:px-5"
                type="button"
              >
                <CalendarDays aria-hidden="true" className="size-6 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium sm:text-base">日付</span>
                <span className={cn('ml-auto text-sm font-medium sm:text-base', !selectedDate && 'text-muted-foreground')}>
                  {selectedDate ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日` : '選択してください'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden p-0" sideOffset={8}>
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
          {errors.transactionDate ? <p className="px-4 pb-3 text-sm text-destructive" role="alert">{errors.transactionDate}</p> : null}
          <FormRow className="border-b">
            <label className="text-sm font-medium sm:text-base" htmlFor="new-transaction-amount">金額</label>
            <span className="ml-auto text-lg font-semibold sm:text-xl">¥</span>
            <Input
              aria-invalid={errors.amount ? true : undefined}
              className="h-12 max-w-44 border-0 px-0 text-right text-xl font-semibold tracking-[-0.04em] tabular-nums shadow-none focus-visible:ring-0 sm:text-2xl"
              id="new-transaction-amount"
              inputMode="numeric"
              maxLength={7}
              onChange={(event) => setValue('amount', event.target.value.replace(/\D/g, ''))}
              placeholder="0"
              value={form.amount}
            />
          </FormRow>
          {errors.amount ? <p className="px-4 pb-3 text-sm text-destructive" role="alert">{errors.amount}</p> : null}
          <FormRow className="min-h-14 sm:min-h-16">
            <label className="text-sm font-medium sm:text-base" htmlFor="new-transaction-name">取引名</label>
            <Input
              aria-invalid={errors.transactionName ? true : undefined}
              className="ml-auto h-11 max-w-64 text-right"
              id="new-transaction-name"
              maxLength={32}
              onChange={(event) => setValue('transactionName', event.target.value)}
              placeholder="例: ランチ"
              value={form.transactionName}
            />
          </FormRow>
          {errors.transactionName ? <p className="px-4 pb-3 text-sm text-destructive" role="alert">{errors.transactionName}</p> : null}
        </FormSection>

        <FormSection>
          <button
            aria-describedby={errors.categoryId || errors.subcategoryId ? 'new-transaction-category-error' : undefined}
            aria-invalid={errors.categoryId || errors.subcategoryId ? true : undefined}
            className="flex min-h-20 w-full items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:px-5"
            onClick={openCategorySelection}
            type="button"
          >
            <span className="text-sm font-medium sm:text-base">カテゴリ</span>
            <span className="ml-auto flex min-w-0 items-center gap-3 text-right">
              {selectedCategory ? <CategoryIcon name={selectedCategory.category_name} /> : null}
              <span className="min-w-0">
                <span className={cn('block truncate text-base font-medium sm:text-lg', !selectedCategory && 'text-muted-foreground')}>
                  {selectedCategory?.category_name ?? '選択してください'}
                </span>
                <span className={cn('mt-0.5 block truncate text-xs sm:text-sm', !selectedSubcategory && 'text-muted-foreground')}>
                  {selectedSubcategory?.sub_category_name ?? 'サブカテゴリを選択'}
                </span>
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          </button>
          {errors.categoryId || errors.subcategoryId ? <p className="px-4 pb-3 text-sm text-destructive" id="new-transaction-category-error" role="alert">{errors.categoryId ?? errors.subcategoryId}</p> : null}
          <div className="border-t" />
          <FormRow>
            <span className="flex items-center gap-2 text-sm font-medium sm:text-base">
              固定費フラグ
              <Info aria-hidden="true" className="size-4 text-muted-foreground" />
            </span>
            <button
              aria-checked={form.fixed}
              aria-label="固定費フラグ"
              className={cn('ml-auto flex h-7 w-12 items-center rounded-full p-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50', form.fixed ? 'bg-primary justify-end' : 'bg-muted-foreground/25 justify-start')}
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
              className="flex min-h-20 w-full items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:px-5"
              onClick={() => setSelectionSheet('payment')}
              type="button"
            >
              <span className="text-sm font-medium sm:text-base">支払い方法</span>
              <span className="ml-auto flex min-w-0 items-center gap-3">
                {selectedPayment ? <PaymentIcon paymentName={selectedPayment.payment_name} paymentTypeName={paymentTypeNames.get(selectedPayment.payment_type_id)} sizeClassName="size-11" /> : null}
                <span className={cn('truncate text-base font-medium sm:text-lg', !selectedPayment && 'text-muted-foreground')}>
                  {paymentsQuery.isError ? '取得できませんでした' : selectedPayment?.payment_name ?? '選択しない'}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </FormSection>
        ) : null}

        {frequentTransactions.length ? <TransactionCandidates onOpenMore={() => setSelectionSheet('candidate')} onSelect={selectFrequentTransaction} transactions={frequentTransactions} /> : null}
        </div>
      </form>
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 sm:static sm:mt-6 sm:flex sm:justify-end">
        <Button className="h-12 rounded-full px-5 shadow-lg sm:h-9 sm:rounded-lg sm:px-2.5 sm:shadow-none" disabled={isSaving || isDeleting} form="transaction-form" size="lg" type="submit">
          {isSaving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          保存
        </Button>
      </div>

      <Sheet onOpenChange={(open) => !open && setSelectionSheet(null)} open={selectionSheet === 'candidate'}>
        <SheetContent className="max-h-[85svh] overflow-hidden rounded-t-3xl p-0" showCloseButton={false} side="bottom">
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

      <Sheet onOpenChange={(open) => { if (!open) { setSelectionSheet(null); setCategorySelectionStep('category') } }} open={selectionSheet === 'category'}>
        <SheetContent className="max-h-[85svh] overflow-y-auto rounded-t-3xl p-0" showCloseButton={false} side="bottom">
          {categorySelectionStep === 'category' ? (
            <div className="animate-in fade-in slide-in-from-left-2 duration-150">
              <SheetHeader className="border-b px-5 py-4 text-left"><SheetTitle>カテゴリを選択</SheetTitle><SheetDescription>取引のカテゴリを選択してください。</SheetDescription></SheetHeader>
              <div className="p-2">
                {categories.map((category) => (
                  <SheetOption isSelected={form.categoryId === category.category_id} key={category.category_id} onClick={() => selectCategory(category.category_id)}>
                    <CategoryIcon name={category.category_name} /><span className="font-medium">{category.category_name}</span>
                  </SheetOption>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-2 duration-150">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <Button aria-label="カテゴリ選択へ戻る" className="-ml-2 mb-1 w-fit" onClick={() => setCategorySelectionStep('category')} size="sm" type="button" variant="ghost">
                  <ArrowLeft aria-hidden="true" /> カテゴリ
                </Button>
                <SheetTitle>サブカテゴリを選択</SheetTitle>
                <SheetDescription>{selectedCategory?.category_name ?? 'カテゴリ'}のサブカテゴリを選択してください。</SheetDescription>
              </SheetHeader>
              <div className="p-2">
                {enabledSubcategories.length ? enabledSubcategories.map((subcategory) => (
                  <SheetOption isSelected={form.subcategoryId === subcategory.sub_category_id} key={subcategory.sub_category_id} onClick={() => { setValue('subcategoryId', subcategory.sub_category_id); setSelectionSheet(null); setCategorySelectionStep('category') }}>
                    <span className="font-medium">{subcategory.sub_category_name}</span>
                  </SheetOption>
                )) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">選択できるサブカテゴリがありません。</p>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={(open) => !open && setSelectionSheet(null)} open={selectionSheet === 'payment'}>
        <SheetContent className="max-h-[85svh] overflow-y-auto rounded-t-3xl p-0" showCloseButton={false} side="bottom">
          <SheetHeader className="border-b px-5 py-4 text-left"><SheetTitle>支払い方法を選択</SheetTitle><SheetDescription>支払い方法は任意です。</SheetDescription></SheetHeader>
          <div className="p-2">
            <SheetOption isSelected={form.paymentId === null} onClick={() => { setValue('paymentId', null); setSelectionSheet(null) }}><span className="font-medium">選択しない</span></SheetOption>
            {payments.map((payment) => (
              <SheetOption isSelected={form.paymentId === payment.payment_id} key={payment.payment_id} onClick={() => { setValue('paymentId', payment.payment_id); setSelectionSheet(null) }}>
                <PaymentIcon paymentName={payment.payment_name} paymentTypeName={paymentTypeNames.get(payment.payment_type_id)} sizeClassName="size-10" /><span className="font-medium">{payment.payment_name}</span>
              </SheetOption>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {isEdit && transaction ? (
        <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>この取引を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{transaction.transaction_name}」 {transaction.amount.toLocaleString('ja-JP')}円の取引を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
              <AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); void handleDelete() }}>
                {isDeleting ? <LoaderCircle aria-hidden="true" className="mr-1.5 size-4 animate-spin" /> : null}
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </section>
  )
}

export function NewTransactionView() {
  return <TransactionFormView />
}

export function EditTransactionView({ transactionId }: { transactionId: string }) {
  return <TransactionFormView transactionId={transactionId} />
}
