import type { TransactionFormExtension } from '@/features/transactions'
import type { Category, HouseholdReference } from '@/shared/api/generated/model'

export function buildFamilyRecordingReferences(
  categories: Category[],
  subcategories: HouseholdReference[],
  payments: HouseholdReference[],
): TransactionFormExtension['references'] {
  return {
    categories: categories.map((c) => ({
      ...c,
      sub_category_list: [
        {
          sub_category_id: 'none',
          sub_category_name: '指定なし',
          enable: true,
        },
        ...subcategories
          .filter((s) => s.active && s.category_id === c.category_id)
          .map((s) => ({
            sub_category_id: s.id,
            sub_category_name: s.name,
            enable: true,
          })),
      ],
    })),
    payments: payments
      .filter((p) => p.active)
      .map((p) => ({
        payment_id: p.id,
        payment_name: p.name,
        payment_type_id: p.payment_type_id ?? '1',
        payment_date: p.payment_date,
        closing_date: p.closing_date ?? 31,
      })),
  }
}
