import {
  useCategoriesWithSubcategories,
  usePayments,
} from '@/shared/hooks/use-reference-queries'

export function useTransactionFilterReferences(enabled: boolean) {
  const categoriesQuery = useCategoriesWithSubcategories(enabled)
  const paymentsQuery = usePayments(enabled)

  return {
    categories:
      categoriesQuery.data?.status === 200
        ? (categoriesQuery.data.data.category_list ?? [])
        : [],
    payments:
      paymentsQuery.data?.status === 200
        ? paymentsQuery.data.data.payment_list
        : [],
    isPending:
      enabled && (categoriesQuery.isPending || paymentsQuery.isPending),
    isError: enabled && (categoriesQuery.isError || paymentsQuery.isError),
    categoriesReady: categoriesQuery.data?.status === 200,
    paymentsReady: paymentsQuery.data?.status === 200,
  }
}
