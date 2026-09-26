import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useAnalysisCategories } from '../api/use-analysis-categories'
import {
  type CategoryGroup,
  type CategoryListMode,
  getSelectedCategory,
  getSelectedSubcategory,
  normalizeCategoryUrlState,
} from '../model/analysis-categories'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisCategoriesController(range: AnalysisRange) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawGroup = searchParams.get('group')
  const rawListMode = searchParams.get('list')
  const rawCategoryId = searchParams.get('category')
  const rawSubcategoryId = searchParams.get('subcategory')
  const { group, listMode } = normalizeCategoryUrlState({
    group: rawGroup,
    listMode: rawListMode,
  })
  const categories = useAnalysisCategories(range, group)
  const selectedCategory = categories.data
    ? getSelectedCategory(categories.data, rawCategoryId)
    : null
  const selectedSubcategory = getSelectedSubcategory(
    selectedCategory,
    rawSubcategoryId,
  )

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    if (searchParams.has('metric')) {
      next.delete('metric')
      changed = true
    }
    if (rawGroup && rawGroup !== group) {
      next.delete('group')
      changed = true
    }
    if (rawListMode && rawListMode !== listMode) {
      next.delete('list')
      changed = true
    }
    const categoryIsInvalid =
      rawCategoryId &&
      categories.data &&
      !categories.data.categories.some(
        (category) => category.id === rawCategoryId,
      )
    if (categoryIsInvalid) {
      next.delete('category')
      next.delete('subcategory')
      changed = true
    }
    if (rawSubcategoryId && selectedCategory && !selectedSubcategory) {
      next.delete('subcategory')
      changed = true
    }
    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [
    categories.data,
    group,
    listMode,
    rawCategoryId,
    rawGroup,
    rawListMode,
    rawSubcategoryId,
    searchParams,
    selectedCategory,
    selectedSubcategory,
    setSearchParams,
  ])

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(name, value)
    setSearchParams(next)
  }

  const changeCategory = (categoryId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('category', categoryId)
    next.delete('subcategory')
    setSearchParams(next)
  }

  const changeSubcategory = (subcategoryId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (subcategoryId) {
      next.set('subcategory', subcategoryId)
    } else {
      next.delete('subcategory')
    }
    setSearchParams(next)
  }

  const openTransaction = (transactionId: string) => {
    navigate(`/app/transactions/${encodeURIComponent(transactionId)}/edit`, {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    })
  }

  return {
    categories,
    selectedCategory,
    selectedSubcategory,
    group,
    listMode,
    changeCategory,
    changeListMode: (mode: CategoryListMode) => setParam('list', mode),
    changeGroup: (nextGroup: CategoryGroup) => setParam('group', nextGroup),
    changeSubcategory,
    openTransaction,
  }
}
