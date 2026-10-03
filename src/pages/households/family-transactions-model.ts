import { buildFamilyPayerTotals } from '@/features/households'
import {
  buildTransactionsViewModelFromItems,
  type TransactionItem,
} from '@/features/transactions'
import type { HouseholdEntry } from '@/shared/api/generated/model'

export function buildFamilyTransactionsViewModel(
  entries: HouseholdEntry[],
  payer = '',
  kind = '',
) {
  const filteredEntries = entries.filter(
    (entry) =>
      (!payer ||
        (payer === 'common'
          ? entry.payer.kind === 'common'
          : entry.payer.member_id === payer)) &&
      (!kind || entry.kind === kind),
  )
  const items = filteredEntries
    .map<TransactionItem>((entry) => ({
      id: entry.entry_id,
      name: entry.transaction_name,
      date: entry.transaction_date,
      amount: entry.amount,
      sign: entry.sign,
      categoryId: entry.category_id,
      categoryName: entry.category_name,
      subcategoryName: entry.household_sub_category_name ?? '指定なし',
      paymentId: entry.household_payment_id,
      paymentName: entry.household_payment_name,
      fixed: entry.fixed_flg,
      excludedFromTotals: entry.excluded_from_totals,
      openLabel: 'の詳細を表示',
      detailLabel: [
        entry.payer.display_name ??
          (entry.payer.kind === 'common' ? '家族共通' : '家族メンバー'),
        ...(entry.corrected ? ['訂正済み'] : []),
        ...(entry.excluded_from_totals ? ['集計除外'] : []),
      ].join('・'),
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.id.localeCompare(a.id, 'ja', { numeric: true }),
    )
  const data = buildTransactionsViewModelFromItems(items)
  const entriesById = new Map(
    filteredEntries.map((entry) => [entry.entry_id, entry]),
  )
  return {
    ...data,
    payerTotals: buildFamilyPayerTotals(filteredEntries),
    familyGroups: data.groups.map((group) => ({
      date: group.date,
      expenseAmount: group.expenseAmount,
      incomeAmount: group.incomeAmount,
      entries: group.items.flatMap((item) => entriesById.get(item.id) ?? []),
    })),
  }
}
