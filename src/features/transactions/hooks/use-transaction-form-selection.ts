import type { Dispatch, RefObject, SetStateAction } from 'react'

import type {
  CategoryWithSubcategoryResponseCategoryListItem,
  FrequentTransactionResponse,
} from '@/shared/api/generated/model'

import type {
  NewTransactionErrors,
  NewTransactionFormValues,
} from '../model/new-transaction'
import {
  applyTransactionRecommendation,
  type TransactionRecommendationOverrides,
} from '../model/transaction-recommendations'
type State<T> = Dispatch<SetStateAction<T>>
type Props = {
  categories: CategoryWithSubcategoryResponseCategoryListItem[]
  isEdit: boolean
  setFormOverride: State<NewTransactionFormValues | null>
  initialForm: NewTransactionFormValues
  setErrors: State<NewTransactionErrors>
  setSelectionSheet: State<'category' | 'payment' | 'candidate' | null>
  setCategorySelectionStep: State<'category' | 'subcategory'>
  setRecommendationInput: State<string>
  newSubcategoryName: string
  setNewSubcategoryName: State<string>
  recommendationOverrides: RefObject<TransactionRecommendationOverrides>
}
export function useTransactionFormSelection({
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
}: Props) {
  const selectCategory = (categoryId: string) => {
    recommendationOverrides.current.category = true
    const options =
      categories
        .find((category) => category.category_id === categoryId)
        ?.sub_category_list.filter((subcategory) => subcategory.enable) ?? []
    const onlyOption = isEdit && options.length === 1 ? options[0] : undefined
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      categoryId,
      subcategoryId: onlyOption?.sub_category_id ?? '',
      subcategoryName: '',
    }))
    setErrors((current) => ({
      ...current,
      categoryId: undefined,
      subcategoryId: undefined,
    }))
    if (onlyOption) {
      setSelectionSheet(null)
      setCategorySelectionStep('category')
    } else {
      setCategorySelectionStep('subcategory')
    }
  }

  const selectFrequentTransaction = (
    transaction: FrequentTransactionResponse['transaction_list'][number],
  ) => {
    const overrides = { ...recommendationOverrides.current }
    setRecommendationInput(transaction.transaction_name)
    setFormOverride((current) =>
      applyTransactionRecommendation(
        current ?? initialForm,
        transaction,
        overrides,
      ),
    )
    setErrors((current) => ({
      ...current,
      transactionName: undefined,
      ...(!overrides.category && {
        categoryId: undefined,
        subcategoryId: undefined,
        subcategoryName: undefined,
      }),
    }))
  }

  const openCategorySelection = () => {
    setCategorySelectionStep('category')
    setSelectionSheet('category')
  }

  const confirmNewSubcategory = () => {
    const name = newSubcategoryName.trim()
    if (name.length < 1 || name.length > 16) {
      setErrors((current) => ({
        ...current,
        subcategoryName: 'サブカテゴリ名は1〜16文字で入力してください。',
      }))
      return
    }
    recommendationOverrides.current.category = true
    setFormOverride((current) => ({
      ...(current ?? initialForm),
      subcategoryId: '',
      subcategoryName: name,
    }))
    setErrors((current) => ({
      ...current,
      subcategoryId: undefined,
      subcategoryName: undefined,
    }))
    setSelectionSheet(null)
    setCategorySelectionStep('category')
  }

  const changeNewSubcategoryName = (name: string) => {
    setNewSubcategoryName(name)
    setErrors((current) => ({ ...current, subcategoryName: undefined }))
  }

  return {
    selectCategory,
    selectFrequentTransaction,
    openCategorySelection,
    confirmNewSubcategory,
    changeNewSubcategoryName,
  }
}
