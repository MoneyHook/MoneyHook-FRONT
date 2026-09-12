import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useAnalysisFixed } from '../api/use-analysis-fixed'
import { normalizeFixedCategorySelection } from '../model/analysis-fixed'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisFixedController(range: AnalysisRange) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawCategoryKey = searchParams.getAll('fixedCategory').join(',')
  const fixed = useAnalysisFixed(range)
  const selectedCategoryIds = useMemo(() => {
    const rawCategoryIds = rawCategoryKey ? rawCategoryKey.split(',') : []
    return fixed.data
      ? normalizeFixedCategorySelection(fixed.data.categories, rawCategoryIds)
      : []
  }, [fixed.data, rawCategoryKey])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (searchParams.has('metric')) {
      next.delete('metric')
      changed = true
    }

    if (fixed.data) {
      const rawCategoryIds = rawCategoryKey ? rawCategoryKey.split(',') : []
      const allSelected =
        selectedCategoryIds.length === fixed.data.categories.length
      const expected = allSelected ? [] : selectedCategoryIds
      const matches =
        expected.length === rawCategoryIds.length &&
        expected.every((id, index) => id === rawCategoryIds[index])

      if (!matches) {
        next.delete('fixedCategory')
        expected.forEach((id) => next.append('fixedCategory', id))
        changed = true
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [
    fixed.data,
    rawCategoryKey,
    searchParams,
    selectedCategoryIds,
    setSearchParams,
  ])

  const setCategories = (categoryIds: string[]) => {
    if (!fixed.data) {
      return
    }
    const selected = new Set(categoryIds)
    const orderedIds = fixed.data.categories
      .filter((category) => selected.has(category.id))
      .map((category) => category.id)
    const next = new URLSearchParams(searchParams)
    next.delete('fixedCategory')
    if (orderedIds.length !== fixed.data.categories.length) {
      orderedIds.forEach((id) => next.append('fixedCategory', id))
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

  const selected = new Set(selectedCategoryIds)
  const selectedCategories = (fixed.data?.categories ?? []).filter((category) =>
    selected.has(category.id),
  )
  const selectedTransactions = (fixed.data?.transactions ?? []).filter(
    (transaction) => selected.has(transaction.categoryId),
  )

  return {
    fixed,
    selectedCategoryIds,
    selectedCategories,
    selectedTransactions,
    setCategories,
    openTransaction,
  }
}
