import type {
  HouseholdEntry,
  HouseholdPayer,
} from '@/shared/api/generated/model'

export type FamilyPayerTotal = {
  id: string
  payer: HouseholdPayer
  amount: number
}

export type FamilyTransactionDayGroup = {
  date: string
  entries: HouseholdEntry[]
  expenseAmount: number
  incomeAmount: number
}

export function getFamilyPayerName(payer: HouseholdPayer) {
  return payer.kind === 'common'
    ? '家族共通'
    : payer.display_name?.trim() || '家族メンバー'
}

export function buildFamilyPayerTotals(entries: HouseholdEntry[]) {
  const totals = new Map<string, FamilyPayerTotal>()
  for (const entry of entries) {
    if (entry.sign !== -1 || entry.excluded_from_totals) continue
    const id =
      entry.payer.kind === 'common'
        ? 'common'
        : `member:${entry.payer.member_id ?? 'unknown'}`
    const total = totals.get(id)
    if (total) total.amount += entry.amount
    else totals.set(id, { id, payer: entry.payer, amount: entry.amount })
  }
  return [...totals.values()].sort(
    (a, b) => b.amount - a.amount || a.id.localeCompare(b.id, 'ja'),
  )
}

export function formatFamilyCurrency(amount: number) {
  return `¥${Math.abs(amount).toLocaleString('ja-JP')}`
}
