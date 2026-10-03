import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  clearDefaultPaymentId,
  readDefaultPaymentId,
} from '@/shared/lib/default-payment'

import { useTransactionDetail } from '../api/use-transaction-detail'
import { useTransactionFormMutations } from '../api/use-transaction-form-mutations'
import { useTransactionFormReferences } from '../api/use-transaction-form-references'
import type { TransactionFormExtension } from '../model/form-extension'
import {
  createNewTransactionValues,
  type NewTransactionErrors,
  type NewTransactionFormValues,
  type NewTransactionSign,
} from '../model/new-transaction'
import {
  getReturnTo,
  getTransactionMonth,
  parseCalendarDate,
} from '../model/transaction-form'
import {
  createTransactionRecommendationIndex,
  getTransactionRecommendations,
  type TransactionRecommendationOverrides,
} from '../model/transaction-recommendations'
import { useTransactionDraft } from './use-transaction-draft'
import { useTransactionFormActions } from './use-transaction-form-actions'
import { useTransactionFormSelection } from './use-transaction-form-selection'

type SelectionSheet = 'category' | 'payment' | 'candidate' | null
type CategorySelectionStep = 'category' | 'subcategory'

export function useTransactionFormController(
  transactionId?: string,
  extension: TransactionFormExtension = {},
) {
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
            subcategoryName: '',
            fixed: transaction.fixed_flg,
            paymentId: transaction.payment_id,
          }
        : createNewTransactionValues(undefined, defaultPaymentId),
    [defaultPaymentId, transaction],
  )
  const draft = useTransactionDraft(transaction?.version)
  const formOverride = draft.form
  const setFormOverride = draft.setForm
  const form = formOverride ?? initialForm
  const [recommendationInput, setRecommendationInput] = useState('')
  const isComposingName = useRef(false)
  const recommendationOverrides = useRef<TransactionRecommendationOverrides>({})
  const [errors, setErrors] = useState<NewTransactionErrors>({})
  const [selectionSheet, setSelectionSheet] = useState<SelectionSheet>(null)
  const [categorySelectionStep, setCategorySelectionStep] =
    useState<CategorySelectionStep>('category')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const familyContext = location.pathname.startsWith('/app/family/')
  const familySearch = new URLSearchParams(location.search)
  familySearch.delete('scope')
  const fallbackReturnTo = familyContext
    ? `/app/family?${familySearch}`
    : transaction
      ? `/app/transactions?month=${getTransactionMonth(transaction.transaction_date)}&view=list`
      : '/app/transactions'
  const returnTo = getReturnTo(location.state, fallbackReturnTo)

  const categories =
    extension.references?.categories ??
    (categoriesQuery.data?.status === 200
      ? (categoriesQuery.data.data.category_list ?? [])
      : [])
  const personalPayments = useMemo(
    () =>
      paymentsQuery.data?.status === 200
        ? paymentsQuery.data.data.payment_list
        : [],
    [paymentsQuery.data],
  )
  const payments = extension.references?.payments ?? personalPayments
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
  const personalFrequentTransactions = useMemo(
    () =>
      frequentTransactionsQuery.data?.status === 200
        ? frequentTransactionsQuery.data.data.transaction_list
        : [],
    [frequentTransactionsQuery.data],
  )
  const frequentTransactions = useMemo(
    () => (extension.references ? [] : personalFrequentTransactions),
    [extension.references, personalFrequentTransactions],
  )
  const recommendationIndex = useMemo(
    () => createTransactionRecommendationIndex(frequentTransactions),
    [frequentTransactions],
  )

  useEffect(() => {
    if (
      isEdit ||
      extension.references ||
      !defaultPaymentId ||
      paymentsQuery.data?.status !== 200 ||
      payments.some((payment) => payment.payment_id === defaultPaymentId)
    ) {
      return
    }

    clearDefaultPaymentId()
    // The fetched payment list invalidates the locally stored selection.

    setFormOverride((current) => {
      const currentForm = current ?? initialForm
      return currentForm.paymentId === defaultPaymentId
        ? { ...currentForm, paymentId: null }
        : currentForm
    })
  }, [
    defaultPaymentId,
    initialForm,
    isEdit,
    payments,
    paymentsQuery.data,
    extension.references,
    setFormOverride,
  ])

  const setValue = <K extends keyof NewTransactionFormValues>(
    key: K,
    value: NewTransactionFormValues[K],
  ) => {
    if (
      key === 'categoryId' ||
      key === 'subcategoryId' ||
      key === 'subcategoryName'
    ) {
      recommendationOverrides.current.category = true
    } else if (key === 'fixed') {
      recommendationOverrides.current.fixed = true
    } else if (key === 'paymentId') {
      recommendationOverrides.current.payment = true
    }
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      [key]: value,
    }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const recommendedTransactions = isEdit
    ? []
    : getTransactionRecommendations(recommendationIndex, recommendationInput)

  const handleNameChange = (name: string) => {
    setValue('transactionName', name)
    if (!isComposingName.current) setRecommendationInput(name)
  }

  const handleNameCompositionStart = () => {
    isComposingName.current = true
  }

  const handleNameCompositionEnd = (name: string) => {
    isComposingName.current = false
    setRecommendationInput(name)
  }

  const {
    selectCategory,
    selectFrequentTransaction,
    openCategorySelection,
    confirmNewSubcategory,
    changeNewSubcategoryName,
  } = useTransactionFormSelection({
    categories,
    isEdit,
    setFormOverride,
    initialForm,
    setErrors,
    setSelectionSheet,
    setCategorySelectionStep,
    setRecommendationInput,
    newSubcategoryName,
    setNewSubcategoryName,
    recommendationOverrides,
  })

  const handleSignChange = (sign: NewTransactionSign) => {
    setValue('sign', sign)
  }

  const { handleSubmit, handleDelete } = useTransactionFormActions({
    form,
    setErrors,
    isEdit,
    transactionId,
    transaction,
    expectedVersion: draft.version,
    mutations,
    navigate,
    returnTo,
    setDeleteDialogOpen,
    extension,
  })

  const isSaving = mutations.isSaving || Boolean(extension.isSaving)
  const isDeleting = mutations.isDeleting
  const isLoading =
    categoriesQuery.isPending || (isEdit && transactionQuery.isPending)

  return {
    isEdit,
    form,
    resetReferences: () =>
      setFormOverride((current) => ({
        ...(current ?? initialForm),
        subcategoryId: '',
        subcategoryName: '',
        paymentId: null,
      })),
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
    recommendedTransactions,
    isLoadingRecommendations: frequentTransactionsQuery.isPending,
    recommendationsError:
      frequentTransactionsQuery.isError && !frequentTransactionsQuery.data,
    handleNameChange,
    handleNameCompositionStart,
    handleNameCompositionEnd,
    setValue,
    selectCategory,
    selectFrequentTransaction,
    openCategorySelection,
    confirmNewSubcategory,
    newSubcategoryName,
    changeNewSubcategoryName,
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
