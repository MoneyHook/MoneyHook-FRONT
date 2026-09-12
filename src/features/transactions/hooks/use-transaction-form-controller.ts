import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  clearDefaultPaymentId,
  readDefaultPaymentId,
} from '@/shared/lib/default-payment'

import { useTransactionDetail } from '../api/use-transaction-detail'
import { useTransactionFormMutations } from '../api/use-transaction-form-mutations'
import { useTransactionFormReferences } from '../api/use-transaction-form-references'
import {
  createNewTransactionValues,
  type NewTransactionErrors,
  type NewTransactionFormValues,
  type NewTransactionSign,
  validateNewTransaction,
} from '../model/new-transaction'
import {
  getReturnTo,
  getTransactionMonth,
  parseCalendarDate,
} from '../model/transaction-form'

type SelectionSheet = 'category' | 'payment' | 'candidate' | null
type CategorySelectionStep = 'category' | 'subcategory'

export function useTransactionFormController(transactionId?: string) {
  const isEdit = Boolean(transactionId)
  const defaultPaymentId = isEdit ? null : readDefaultPaymentId()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    categoriesQuery,
    paymentsQuery,
    paymentTypesQuery,
    frequentTransactionsQuery,
  } = useTransactionFormReferences({ isEdit })
  const transactionQuery = useTransactionDetail(transactionId)
  const mutations = useTransactionFormMutations()
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
        : createNewTransactionValues(undefined, defaultPaymentId),
    [defaultPaymentId, transaction],
  )
  const [formOverride, setFormOverride] =
    useState<NewTransactionFormValues | null>(null)
  const form = formOverride ?? initialForm
  const [errors, setErrors] = useState<NewTransactionErrors>({})
  const [selectionSheet, setSelectionSheet] = useState<SelectionSheet>(null)
  const [categorySelectionStep, setCategorySelectionStep] =
    useState<CategorySelectionStep>('category')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const fallbackReturnTo = transaction
    ? `/app/transactions?month=${getTransactionMonth(transaction.transaction_date)}&view=list`
    : '/app/transactions'
  const returnTo = getReturnTo(location.state, fallbackReturnTo)

  const categories =
    categoriesQuery.data?.status === 200
      ? (categoriesQuery.data.data.category_list ?? [])
      : []
  const payments = useMemo(
    () =>
      paymentsQuery.data?.status === 200
        ? paymentsQuery.data.data.payment_list
        : [],
    [paymentsQuery.data],
  )
  const paymentTypeNames = useMemo(
    () =>
      new Map(
        paymentTypesQuery.data?.status === 200
          ? paymentTypesQuery.data.data.payment_type_list.map((type) => [
              type.payment_type_id,
              type.payment_type_name,
            ])
          : [],
      ),
    [paymentTypesQuery.data],
  )
  const selectedCategory = categories.find(
    (category) => category.category_id === form.categoryId,
  )
  const enabledSubcategories = (
    selectedCategory?.sub_category_list ?? []
  ).filter((subcategory) => subcategory.enable)
  const selectedSubcategory = enabledSubcategories.find(
    (subcategory) => subcategory.sub_category_id === form.subcategoryId,
  )
  const selectedPayment = payments.find(
    (payment) => payment.payment_id === form.paymentId,
  )
  const selectedDate = parseCalendarDate(form.transactionDate)
  const frequentTransactions =
    frequentTransactionsQuery.data?.status === 200
      ? frequentTransactionsQuery.data.data.transaction_list
      : []

  useEffect(() => {
    if (
      isEdit ||
      !defaultPaymentId ||
      paymentsQuery.data?.status !== 200 ||
      payments.some((payment) => payment.payment_id === defaultPaymentId)
    ) {
      return
    }

    clearDefaultPaymentId()
    // The fetched payment list invalidates the locally stored selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormOverride((current) => {
      const currentForm = current ?? initialForm
      return currentForm.paymentId === defaultPaymentId
        ? { ...currentForm, paymentId: null }
        : currentForm
    })
  }, [defaultPaymentId, initialForm, isEdit, payments, paymentsQuery.data])

  const setValue = <K extends keyof NewTransactionFormValues>(
    key: K,
    value: NewTransactionFormValues[K],
  ) => {
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      [key]: value,
    }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const selectCategory = (categoryId: string) => {
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      categoryId,
      subcategoryId: '',
    }))
    setErrors((current) => ({
      ...current,
      categoryId: undefined,
      subcategoryId: undefined,
    }))
    setCategorySelectionStep('subcategory')
  }

  const selectFrequentTransaction = (
    transaction: (typeof frequentTransactions)[number],
  ) => {
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
        await mutations.update(transactionId, form)
        toast.success('取引を更新しました。')
        navigate(returnTo, { replace: true })
        return
      }

      await mutations.create(form)
      const month = getTransactionMonth(form.transactionDate)
      toast.success('取引を保存しました。')
      navigate(`/app/transactions?month=${month}&view=list`, { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '取引を保存できませんでした。',
      )
    }
  }

  const handleDelete = async () => {
    if (!transactionId || !transaction) {
      return
    }

    try {
      await mutations.remove(transactionId)
      setDeleteDialogOpen(false)
      toast.success('取引を削除しました。')
      navigate(returnTo, { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '取引を削除できませんでした。',
      )
    }
  }

  const isSaving = mutations.isSaving
  const isDeleting = mutations.isDeleting
  const isLoading =
    categoriesQuery.isPending || (isEdit && transactionQuery.isPending)

  return {
    isEdit,
    form,
    errors,
    selectionSheet,
    categorySelectionStep,
    deleteDialogOpen,
    datePickerOpen,
    setSelectionSheet,
    setCategorySelectionStep,
    setDeleteDialogOpen,
    setDatePickerOpen,
    categories,
    payments,
    paymentTypeNames,
    selectedCategory,
    enabledSubcategories,
    selectedSubcategory,
    selectedPayment,
    selectedDate,
    frequentTransactions,
    setValue,
    selectCategory,
    selectFrequentTransaction,
    openCategorySelection,
    handleSignChange,
    handleSubmit,
    handleDelete,
    isSaving,
    isDeleting,
    isLoading,
    transaction,
    hasError:
      (categoriesQuery.isError && !categoriesQuery.data) ||
      (isEdit && !transaction),
    error: transactionQuery.isError
      ? transactionQuery.error
      : categoriesQuery.error,
    retry: () =>
      transactionQuery.isError
        ? transactionQuery.refetch()
        : categoriesQuery.refetch(),
    paymentsError: paymentsQuery.isError,
    goBack: () => navigate(returnTo),
    openCsvImport: () => navigate('/app/transactions/import'),
  }
}

export type TransactionFormController = ReturnType<
  typeof useTransactionFormController
>
