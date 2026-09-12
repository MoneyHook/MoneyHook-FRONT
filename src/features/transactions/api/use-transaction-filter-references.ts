import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'

export function useTransactionFilterReferences(enabled: boolean) {
  const categoriesQuery = useGetCategoryWithSubCategoryList({
    query: { enabled },
  })
  const paymentsQuery = useGetPaymentResources({ query: { enabled } })

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
