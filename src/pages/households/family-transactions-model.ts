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
  const items = entries
    .filter(
      (entry) =>
        (!payer ||
          (payer === 'common'
            ? entry.payer.kind === 'common'
            : entry.payer.member_id === payer)) &&
        (!kind || entry.kind === kind),
    )
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
        { shared: '原本共有', proxy: '代理記録', snapshot: '控え' }[entry.kind],
        ...(entry.corrected ? ['訂正済み'] : []),
        ...(entry.excluded_from_totals ? ['集計除外'] : []),
      ].join('・'),
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.id.localeCompare(a.id, 'ja', { numeric: true }),
    )
  return buildTransactionsViewModelFromItems(items)
}
