import type {
  GetV1AnalyticsCategoriesParams,
  V1CategoriesResponse,
} from '@/shared/api/generated/model'

import type { MonthContext } from './home-dashboard'

export type CategoryChange = {
  categoryId: string
  name: string
  currentAmount: number
  previousAmount: number
  difference: number
  differenceRate: number | null
  isNewExpense: boolean
}

export type HomeChangesViewModel = {
  currentRange: GetV1AnalyticsCategoriesParams
  previousRange: GetV1AnalyticsCategoriesParams
  isCurrentMonth: boolean
  increase: CategoryChange | null
  decrease: CategoryChange | null
}

export function createHomeChangeParameters(month: MonthContext) {
  const previousDays = Number(month.previousEndDate.slice(8, 10))
  return {
    current: {
      start_date: month.startDate,
      end_date: month.isCurrentMonth
        ? `${month.monthInput}-${String(month.elapsedDays).padStart(2, '0')}`
        : month.endDate,
      group_by: 'month' as const,
    },
    previous: {
      start_date: month.previousStartDate,
      end_date: month.isCurrentMonth
        ? `${month.previousMonth.slice(0, 7)}-${String(Math.min(month.elapsedDays, previousDays)).padStart(2, '0')}`
        : month.previousEndDate,
      group_by: 'month' as const,
    },
  }
}

function variableAmounts(response: V1CategoriesResponse) {
  const amounts = new Map<string, { name: string; amount: number }>()
  let expenseCount = 0
  let variableCount = 0
  // Use only the category-level list; subcategory lists repeat these transactions.
  for (const category of response.category_list) {
    for (const transaction of category.transaction_list) {
      if (transaction.sign !== -1) continue
      expenseCount += 1
      if (transaction.fixed_flg) continue
      variableCount += 1
      const previous = amounts.get(category.category_id)
      amounts.set(category.category_id, {
        name: category.category_name,
        amount: (previous?.amount ?? 0) + transaction.amount,
      })
    }
  }
  return { amounts, expenseCount, variableCount }
}

export function buildHomeChangesViewModel(
  current: V1CategoriesResponse,
  previous: V1CategoriesResponse,
  month: MonthContext,
): HomeChangesViewModel | null {
  const currentData = variableAmounts(current)
  const previousData = variableAmounts(previous)
  if (currentData.variableCount === 0 || previousData.expenseCount === 0) {
    return null
  }

  const earlyMonth = month.isCurrentMonth && month.elapsedDays < 7
  const minimumAmount = earlyMonth ? 10_000 : 3_000
  const minimumRate = earlyMonth ? 50 : 20
  const ids = new Set([
    ...currentData.amounts.keys(),
    ...previousData.amounts.keys(),
  ])
  const changes: CategoryChange[] = []
  for (const categoryId of ids) {
    const currentCategory = currentData.amounts.get(categoryId)
    const previousCategory = previousData.amounts.get(categoryId)
    const currentAmount = currentCategory?.amount ?? 0
    const previousAmount = previousCategory?.amount ?? 0
    const difference = currentAmount - previousAmount
    const differenceRate =
      previousAmount === 0 ? null : (difference / previousAmount) * 100
    if (earlyMonth && difference <= 0) continue
    if (Math.abs(difference) < minimumAmount) continue
    if (differenceRate !== null && Math.abs(differenceRate) < minimumRate) {
      continue
    }
    changes.push({
      categoryId,
      name: currentCategory?.name ?? previousCategory!.name,
      currentAmount,
      previousAmount,
      difference,
      differenceRate,
      isNewExpense: previousAmount === 0,
    })
  }
  changes.sort((left, right) => {
    const amountOrder = Math.abs(right.difference) - Math.abs(left.difference)
    return amountOrder || left.categoryId.localeCompare(right.categoryId, 'en')
  })
  const increase = changes.find((change) => change.difference > 0) ?? null
  const decrease = changes.find((change) => change.difference < 0) ?? null
  if (!increase && !decrease) return null
  const parameters = createHomeChangeParameters(month)
  return {
    currentRange: parameters.current,
    previousRange: parameters.previous,
    isCurrentMonth: month.isCurrentMonth,
    increase,
    decrease,
  }
}
